"use client";

import { ChevronDown, Share2, Download, Maximize2, History, MoreHorizontal, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useEditor } from "tldraw";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface TopBarProps {
    projectName: string;
    onProjectNameChange: (name: string) => void;
    className?: string;
}

export default function TopBar({ projectName, onProjectNameChange, className }: TopBarProps) {
    const editor = useEditor();
    const t = useTranslations('TopBar');
    const locale = useLocale();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [localName, setLocalName] = useState(projectName);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setLocalName(projectName);
    }, [projectName]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        const isImage = file.type.startsWith('image/');
        if (!isImage) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const src = reader.result as string;

            let width = 500;
            let height = 500;

            const img = new Image();
            img.src = src;
            await new Promise((resolve) => {
                img.onload = () => {
                    width = img.width;
                    height = img.height;
                    resolve(null);
                }
            });

            const assetId = `asset:${Date.now()}` as any;
            const viewportBounds = editor.getViewportPageBounds();

            // Create asset
            editor.createAssets([
                {
                    id: assetId,
                    typeName: 'asset',
                    type: 'image',
                    props: {
                        name: file.name,
                        src: src,
                        w: width,
                        h: height,
                        mimeType: file.type,
                        isAnimated: false,
                    },
                    meta: {},
                },
            ]);

            // Create shape
            editor.createShapes([
                {
                    type: 'image',
                    x: viewportBounds.center.x - width / 2,
                    y: viewportBounds.center.y - height / 2,
                    props: {
                        assetId: assetId,
                        w: width,
                        h: height,
                    },
                },
            ]);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    return (
        <div className={`fixed top-0 left-0 right-0 h-[60px] flex items-center justify-between px-6 z-[2000] pointer-events-none ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />

            {/* Left: Logo & Project Name Container */}
            <div className="pointer-events-auto">
                <DropdownMenu onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm rounded-full pl-1.5 pr-4 py-1.5 cursor-pointer hover:bg-white/90 transition-colors select-none">
                            {/* Logo */}
                            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                <img src="/1and1design.png" alt="Logo" className="w-full h-full object-cover" />
                            </div>

                            {/* Dropdown Arrow */}
                            <div className="text-gray-500">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>

                            {/* Project Name */}
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    className="bg-transparent border-none outline-none font-medium text-sm text-gray-900 w-[100px] p-0"
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    onBlur={() => {
                                        setIsEditingName(false);
                                        if (localName !== projectName) {
                                            onProjectNameChange(localName);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            setIsEditingName(false);
                                            if (localName !== projectName) {
                                                onProjectNameChange(localName);
                                            }
                                        }
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="font-medium text-sm text-gray-900"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalName(projectName);
                                        setIsEditingName(true);
                                    }}
                                >
                                    {projectName || t('untitled')}
                                </span>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={8} className="w-48 bg-white/95 backdrop-blur-md rounded-xl border-gray-100 shadow-xl p-1.5 z-[3000]">
                        <DropdownMenuItem className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs" asChild>
                            <Link href="/home">{t('home')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs" asChild>
                            <Link href={`/${locale}/projects`}>{t('projects')}</Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-100 my-1" />

                        <DropdownMenuItem className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs">
                            {t('newProject')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg focus:bg-gray-100 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 text-xs">
                            {t('deleteProject')}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {t('importImage')}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-100 my-1" />

                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => editor?.undo()}
                        >
                            {t('undo')}
                            <DropdownMenuShortcut className="text-[10px]">⌘ Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => editor?.redo()}
                        >
                            {t('redo')}
                            <DropdownMenuShortcut className="text-[10px]">⌘ ⇧ Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => {
                                const selectedIds = editor?.getSelectedShapeIds();
                                if (selectedIds && selectedIds.length > 0) {
                                    editor?.duplicateShapes(selectedIds);
                                }
                            }}
                        >
                            {t('duplicate')}
                            <DropdownMenuShortcut className="text-[10px]">⌘ D</DropdownMenuShortcut>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-gray-100 my-1" />

                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => editor?.zoomToFit()}
                        >
                            {t('zoomToFit')}
                            <DropdownMenuShortcut className="text-[10px]">⇧ 1</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => editor?.zoomIn()}
                        >
                            {t('zoomIn')}
                            <DropdownMenuShortcut className="text-[10px]">⌘ +</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="rounded-lg focus:bg-gray-100 cursor-pointer text-xs"
                            onClick={() => editor?.zoomOut()}
                        >
                            {t('zoomOut')}
                            <DropdownMenuShortcut className="text-[10px]">⌘ -</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right: Actions */}
            <div className="pointer-events-auto flex items-center gap-2">
            </div>
        </div>
    );
}
