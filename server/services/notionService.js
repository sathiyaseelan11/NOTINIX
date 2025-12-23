const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const Integration = require('../models/Integration');
const SyncLog = require('../models/SyncLog');
const Note = require('../models/noteModel');

// Helper to get client for a specific user
const getNotionClient = async (userId) => {
    const integration = await Integration.findOne({ user: userId, platform: 'notion' });
    if (!integration || !integration.accessToken) {
        throw new Error('Notion integration not connected');
    }
    return new Client({ auth: integration.accessToken });
};

const syncNotion = async (userId) => {
    // 1. Start Log
    const integration = await Integration.findOne({ user: userId, platform: 'notion' });
    if (!integration) throw new Error('Notion not connected');

    const log = await SyncLog.create({
        user: userId,
        integration: integration._id,
        platform: 'notion',
        status: 'running'
    });

    const startTime = Date.now();

    try {
        const notion = new Client({ auth: integration.accessToken });
        const n2m = new NotionToMarkdown({ notionClient: notion });

        // 2. Search for all pages
        // In a real app, use 'last_edited_time' filter for incremental sync
        const response = await notion.search({
            filter: { property: 'object', value: 'page' },
            sort: { direction: 'descending', timestamp: 'last_edited_time' }
        });

        const pages = response.results;
        let created = 0;
        let updated = 0;

        for (const page of pages) {
            // Check if page has a title
            // Notion titles can be tricky structure-wise
            let title = 'Untitled Notion Page';
            try {
                const props = page.properties;
                // Find the 'title' type property
                const titleKey = Object.keys(props).find(k => props[k].type === 'title');
                if (titleKey && props[titleKey].title.length > 0) {
                    title = props[titleKey].title[0].plain_text;
                }
            } catch (e) {
                console.log('Error parsing title', e);
            }

            // Convert blocks to markdown
            const mdblocks = await n2m.pageToMarkdown(page.id);
            const mdString = n2m.toMarkdownString(mdblocks);

            // Check if we already have this note
            // We should store external Id but for now let's query by title/metadata or just upsert
            // Ideally Note model needs 'externalId' and 'source' fields.
            // For now, I'll attempt to add 'source: notion' to tags or metadata.

            // Simplistic Upsert logic based on title (WARNING: Duplicates possible if titles match)
            // Real implementation requires schema change to add `externalId`.
            // Let's assume we proceed with creating new notes if not found by title + source tag

            /* 
                Since Note model doesn't have externalId yet, 
                let's assume we find by title AND tags includes 'notion-import'
            */

            const existing = await Note.findOne({
                user: userId,
                title: title,
                tags: 'notion-import'
            });

            const noteData = {
                user: userId,
                title: title,
                content: mdString.parent || '',
                tags: ['notion-import', 'synced'],
                isFavorite: false
            };

            if (existing) {
                // Update
                await Note.findByIdAndUpdate(existing._id, noteData);
                updated++;
            } else {
                // Create
                await Note.create(noteData);
                created++;
            }
        }

        // 3. Complete Log
        log.status = 'success';
        log.itemsProcessed = pages.length;
        log.itemsCreated = created;
        log.itemsUpdated = updated;
        log.durationMs = Date.now() - startTime;
        await log.save();

        // Update Lat Synced
        integration.lastSyncedAt = new Date();
        await integration.save();

        return log;

    } catch (error) {
        console.error('Notion Sync Error:', error);
        log.status = 'failed';
        log.details = error.message;
        log.durationMs = Date.now() - startTime;
        await log.save();
        throw error;
    }
};

module.exports = {
    syncNotion
};
