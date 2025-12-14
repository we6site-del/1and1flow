
import { Button } from "@/components/ui/button";
import { History, Share2, FolderOpen, PanelRightClose, Settings, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
// We'll accept a render prop or children for the ModelConfig popover content
// ensuring we don't cause circular dependencies or complex prop drilling if we can avoid it.

interface SidebarHeaderProps {
    onClose: () => void;
    onClearHistory: () => void;
    onShare: () => void;
    modelConfigContent: React.ReactNode;
}

export function SidebarHeader({ onClose, onClearHistory, onShare, modelConfigContent }: SidebarHeaderProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-5 gradient-mask-b">
            {/* Left: Model Config Trigger */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-2 pl-2 pr-3 bg-white/50 hover:bg-white border border-transparent hover:border-gray-200 rounded-full transition-all text-gray-700 font-medium text-xs">
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Config</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[380px] p-5 rounded-[24px] shadow-2xl border-gray-100 bg-white/95 backdrop-blur-xl ml-4 z-[3000]">
                    {modelConfigContent}
                </PopoverContent>
            </Popover>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={onShare} className="gap-2">
                            <Share2 className="w-3.5 h-3.5" /> Share Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onClearHistory} className="gap-2 text-red-600 focus:text-red-700">
                            <History className="w-3.5 h-3.5" /> Clear History
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full transition-transform hover:rotate-90">
                    <PanelRightClose className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
