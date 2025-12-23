const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

// @desc    Upload generic file (Image, PDF, etc.)
// @route   POST /api/upload
// @access  Private
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileName = req.file.filename;
        const originalName = req.file.originalname;
        const filePath = req.file.path;
        const mimeType = req.file.mimetype;

        let extractedText = '';

        // Extract text based on file type
        try {
            if (mimeType === 'application/pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                extractedText = data.text;
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value;
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
                const workbook = xlsx.readFile(filePath);
                let sheetText = '';
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    sheetText += xlsx.utils.sheet_to_txt(worksheet);
                });
                extractedText = sheetText;
            } else if (mimeType.startsWith('text/')) {
                extractedText = fs.readFileSync(filePath, 'utf8');
            }
        } catch (extractError) {
            console.error('Text extraction error:', extractError);
            // We still return the file even if extraction fails
        }

        // Construct public URL
        const url = `/uploads/${fileName}`;

        res.status(201).json({
            url: url,
            name: originalName,
            type: mimeType,
            size: req.file.size,
            extractedText: extractedText.substring(0, 50000) // Limit text size for safety
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadFile
};
