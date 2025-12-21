import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AiModel } from "@/hooks/useAiModels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Brain, Clapperboard, Image as ImageIcon, Sparkles, ChevronDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DynamicForm } from "@/components/canvas/nodes/DynamicForm";

interface ModelConfigProps {
    chatModels: AiModel[];
    imageModels: AiModel[];
    videoModels: AiModel[];
    selectedChatModel: string;
    onChatModelChange: (id: string) => void;
    selectedImageModel: string;
    onImageModelChange: (id: string) => void;
    selectedVideoModel: string;
    onVideoModelChange: (id: string) => void;
    chatModelsLoading?: boolean;
    chatModelsError?: Error | null;
    // Params
    imageModelParams: Record<string, any>;
    onImageModelParamsChange: (params: Record<string, any>) => void;
    videoModelParams: Record<string, any>;
    onVideoModelParamsChange: (params: Record<string, any>) => void;
}

export function ModelConfig({
    chatModels,
    imageModels,
    videoModels,
    selectedChatModel,
    onChatModelChange,
    selectedImageModel,
    onImageModelChange,
    selectedVideoModel,
    onVideoModelChange,
    chatModelsLoading,
    chatModelsError,
    imageModelParams,
    onImageModelParamsChange,
    videoModelParams,
    onVideoModelParamsChange
}: ModelConfigProps) {
    const [isAuto, setIsAuto] = useState(false);

    const activeImageModel = useMemo(() => imageModels.find(m => m.id === selectedImageModel), [imageModels, selectedImageModel]);
    const activeVideoModel = useMemo(() => videoModels.find(m => m.id === selectedVideoModel), [videoModels, selectedVideoModel]);

    const handleImageParamChange = (key: string, value: any) => {
        onImageModelParamsChange({ ...imageModelParams, [key]: value });
    };

    const handleVideoParamChange = (key: string, value: any) => {
        onVideoModelParamsChange({ ...videoModelParams, [key]: value });
    };

    return (
        <div className="space-y-6 font-sans">
            {/* The Brain: Chat Model */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Brain className="w-4 h-4 text-black" />
                    <span>The Brain (思考模型)</span>
                    {chatModelsLoading && (
                        <span className="text-[10px] text-gray-400 font-normal">Loading...</span>
                    )}
                </div>

                {chatModelsError ? (
                    <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                        Failed to load chat models. Please check admin panel.
                    </div>
                ) : chatModelsLoading ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                ) : chatModels.length === 0 ? (
                    <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        No chat models available. Please add models in admin panel.
                    </div>
                ) : (
                    <Select value={selectedChatModel} onValueChange={onChatModelChange}>
                        <SelectTrigger className="w-full bg-white border border-gray-200 focus:ring-1 focus:ring-black/10 rounded-xl h-10">
                            <SelectValue placeholder="Select a brain" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            {chatModels.filter(m => m.api_path && m.id).map((model) => (
                                <SelectItem key={model.id} value={model.api_path} className="rounded-lg my-0.5 cursor-pointer focus:bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        {model.icon_url && (
                                            <img src={model.icon_url} alt="" className="w-4 h-4 rounded-sm" />
                                        )}
                                        <span className="font-medium text-gray-900">{model.name}</span>
                                        {model.cost_per_gen === 0 && (
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-100/50">Free</span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                <p className="text-[11px] text-gray-400 px-1">
                    负责理解意图、编写提示词和控制工具调用。
                </p>
            </div >

            <div className="h-px bg-gray-100" />

            {/* The Hands: Tool Models */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span>The Hands (执行模型)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium">Auto Select</span>
                        <Switch checked={isAuto} onCheckedChange={setIsAuto} className="scale-75 origin-right data-[state=checked]:bg-black" />
                    </div>
                </div>

                <Tabs defaultValue="image" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 bg-gray-100 p-1 rounded-xl">
                        <TabsTrigger value="image" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300">Image</TabsTrigger>
                        <TabsTrigger value="video" className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-300">Video</TabsTrigger>
                    </TabsList>

                    <div className="pt-3">
                        <TabsContent value="image" className="mt-0 space-y-4">
                            {isAuto ? (
                                <div className="text-xs text-gray-500 text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-gray-300" />
                                    <span>AI 将根据需求自动选择最佳绘图模型</span>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        {imageModels.map(model => (
                                            <ModelCard
                                                key={model.id}
                                                model={model}
                                                isSelected={selectedImageModel === model.id}
                                                onSelect={() => onImageModelChange(model.id)}
                                                icon={ImageIcon}
                                            />
                                        ))}
                                    </div>

                                    {/* Dynamic Params for Image Model */}
                                    {activeImageModel && activeImageModel.parameters_schema && activeImageModel.parameters_schema.length > 0 && (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Parameters</p>
                                            <DynamicForm
                                                schema={activeImageModel.parameters_schema}
                                                values={imageModelParams}
                                                onChange={handleImageParamChange}
                                                className="flex-wrap gap-2 max-w-full"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="video" className="mt-0 space-y-4">
                            {isAuto ? (
                                <div className="text-xs text-gray-500 text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
                                    <Clapperboard className="w-4 h-4 text-gray-300" />
                                    <span>AI 将根据需求自动选择最佳视频模型</span>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-2">
                                        {videoModels.map(model => (
                                            <ModelCard
                                                key={model.id}
                                                model={model}
                                                isSelected={selectedVideoModel === model.id}
                                                onSelect={() => onVideoModelChange(model.id)}
                                                icon={Clapperboard}
                                            />
                                        ))}
                                    </div>

                                    {/* Dynamic Params for Video Model */}
                                    {activeVideoModel && activeVideoModel.parameters_schema && activeVideoModel.parameters_schema.length > 0 && (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                                            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Parameters</p>
                                            <DynamicForm
                                                schema={activeVideoModel.parameters_schema}
                                                values={videoModelParams}
                                                onChange={handleVideoParamChange}
                                                className="flex-wrap gap-2 max-w-full"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div >
    );
}

const ModelCard = ({ model, isSelected, onSelect, icon: FallbackIcon }: { model: AiModel, isSelected: boolean, onSelect: () => void, icon: any }) => (
    <div
        className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border group",
            isSelected
                ? "bg-white border-black ring-1 ring-black shadow-md shadow-black/5"
                : "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
        )}
        onClick={onSelect}
    >
        <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors bg-gray-50 overflow-hidden",
            isSelected ? "ring-1 ring-black" : ""
        )}>
            {model.icon_url ? (
                <img src={model.icon_url} alt="" className="w-full h-full object-cover" />
            ) : (
                <FallbackIcon className={cn("w-4 h-4", isSelected ? "text-black" : "text-gray-500")} />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <h4 className={cn("font-medium text-xs truncate transition-colors", isSelected ? "text-black" : "text-gray-700")}>{model.name}</h4>
                {model.id.includes('pro') && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded ml-2 font-medium">PRO</span>}
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{model.description || "Generative AI Model"}</p>
        </div>
        <div className={cn(
            "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
            isSelected ? "bg-black border-black" : "border-gray-200"
        )}>
            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
    </div>
);
