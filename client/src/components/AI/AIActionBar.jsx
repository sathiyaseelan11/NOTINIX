import { Sparkles, CheckSquare, Tag, Network, Loader2, MessageSquare } from 'lucide-react';

const AIActionBar = ({
    onSummarize,
    onExtractTasks,
    onAutoTag,
    onFindRelated,
    onAskAI,
    loadingAction
}) => {
    const ActionButton = ({ icon: Icon, label, onClick, actionName, colorClass }) => (
        <button
            onClick={() => onClick()}
            disabled={!!loadingAction}
            className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${loadingAction === actionName
                    ? 'bg-gray-800 text-gray-400 cursor-wait'
                    : `bg-[#252525] border border-[#3A3A3A] hover:bg-[#2C2C2C] hover:border-opacity-50 hover:shadow-lg ${colorClass} text-gray-300 hover:text-white`
                }
                ${loadingAction && loadingAction !== actionName ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            {loadingAction === actionName ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110`} />
            )}
            <span>{loadingAction === actionName ? 'Processing...' : label}</span>
        </button>
    );

    return (
        <div className="flex items-center gap-3 py-2 overflow-x-auto scrollbar-hide">
            <ActionButton
                icon={Sparkles}
                label="Summarize"
                actionName="summarize"
                onClick={onSummarize}
                colorClass="hover:border-purple-500 hover:shadow-purple-500/10"
            />
            <ActionButton
                icon={CheckSquare}
                label="Extract Tasks"
                actionName="extract"
                onClick={onExtractTasks}
                colorClass="hover:border-green-500 hover:shadow-green-500/10"
            />
            <ActionButton
                icon={Tag}
                label="Auto-tag"
                actionName="autotag"
                onClick={onAutoTag}
                colorClass="hover:border-blue-500 hover:shadow-blue-500/10"
            />
            <ActionButton
                icon={Network}
                label="Find Related"
                actionName="related"
                onClick={onFindRelated}
                colorClass="hover:border-emerald-500 hover:shadow-emerald-500/10"
            />
            <ActionButton
                icon={MessageSquare}
                label="Ask AI"
                actionName="ask"
                onClick={onAskAI}
                colorClass="hover:border-blue-400 hover:shadow-blue-400/10"
            />
        </div>
    );
};

export default AIActionBar;
