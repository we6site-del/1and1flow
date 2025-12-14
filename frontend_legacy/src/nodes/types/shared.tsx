import classNames from 'classnames'
import React, { PointerEvent, useCallback, useRef, useState } from 'react'
import {
	Editor,
	T,
	TldrawUiButton,
	TldrawUiButtonIcon,
	TLShapeId,
	TLUiIconJsx,
	useEditor,
	useValue,
} from 'tldraw'
import { AddIcon } from '../../components/icons/AddIcon'
import { SubtractIcon } from '../../components/icons/SubtractIcon'
import { NODE_HEADER_HEIGHT_PX, NODE_WIDTH_PX } from '../../constants'
import { Port, PortId, ShapePort } from '../../ports/Port'
import { getNodeInputPortValues } from '../nodePorts'
import { NodeShape } from '../NodeShapeUtil'
import { NodeType } from '../nodeTypes'

export type WorkflowValue = number

/**
 * A special value that can be returned from a node to indicate that execution should stop.
 */
export type STOP_EXECUTION = typeof STOP_EXECUTION
export const STOP_EXECUTION = Symbol('STOP_EXECUTION')

export interface InfoValues {
	[key: string]: { value: WorkflowValue | STOP_EXECUTION; isOutOfDate: boolean }
}

export interface ExecutionResult {
	[key: string]: WorkflowValue | STOP_EXECUTION
}

export interface InputValues {
	[key: string]: WorkflowValue
}

export interface NodeComponentProps<Node extends { type: string }> {
	shape: NodeShape
	node: Node
}

export abstract class NodeDefinition<Node extends { type: string }> {
	constructor(public readonly editor: Editor) {
		const ctor = this.constructor as NodeDefinitionConstructor<Node>
		this.type = ctor.type
		this.validator = ctor.validator
	}

	readonly type: Node['type']
	readonly validator: T.Validator<Node>
	abstract readonly title: string
	abstract readonly heading?: string
	abstract readonly icon: TLUiIconJsx

	abstract getDefault(): Node
	abstract getBodyHeightPx(shape: NodeShape, node: Node): number
	abstract getPorts(shape: NodeShape, node: Node): Record<string, ShapePort>
	onPortConnect(_shape: NodeShape, _node: Node, _port: PortId): void {}
	onPortDisconnect(_shape: NodeShape, _node: Node, _port: PortId): void {}
	abstract getOutputInfo(shape: NodeShape, node: Node, inputs: InfoValues): InfoValues
	abstract execute(shape: NodeShape, node: Node, inputs: InputValues): Promise<ExecutionResult>
	abstract Component: React.ComponentType<NodeComponentProps<Node>>
}

export interface NodeDefinitionConstructor<Node extends { type: string }> {
	new (editor: Editor): NodeDefinition<Node>
	readonly type: Node['type']
	readonly validator: T.Validator<Node>
}

/**
 * The standard output port for a node, appearing in the node header.
 */
export const outputPort: ShapePort = {
	id: 'output',
	x: NODE_WIDTH_PX,
	y: NODE_HEADER_HEIGHT_PX / 2,
	terminal: 'start',
}

/**
 * Update the `node` prop within a node shape.
 */
export function updateNode<T extends NodeType>(
	editor: Editor,
	shape: NodeShape,
	update: (node: T) => T,
	isOutOfDate: boolean = true
) {
	editor.updateShape<NodeShape>({
		id: shape.id,
		type: shape.type,
		props: { node: update(shape.props.node as T), isOutOfDate },
	})
}

/**
 * A row in a node. This component just applies some styling.
 */
export function NodeRow({
	children,
	className,
	...props
}: {
	children: React.ReactNode
	className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={classNames('NodeRow', className)}>
			{children}
		</div>
	)
}

/**
 * A row in a node for a numeric input. If the port is connected, the input is disabled and the
 * value is taken from the port. Otherwise, the input is editable with a spinner for incrementing
 * and decrementing the value.
 */
export function NodeInputRow({
	shapeId,
	portId,
	value,
	onChange,
	onBlur,
}: {
	shapeId: TLShapeId
	portId: PortId
	value: number
	onChange: (value: number) => void
	onBlur?: () => void
}) {
	const editor = useEditor()
	const inputRef = useRef<HTMLInputElement>(null)
	const portInfo = useValue('from port', () => getNodeInputPortValues(editor, shapeId)[portId], [
		editor,
		shapeId,
		portId,
	])
	const valueFromPort = portInfo?.value
	const isOutOfDate = portInfo?.isOutOfDate

	const [pendingValue, setPendingValue] = useState<string | null>(null)

	const onPointerDown = useCallback((event: PointerEvent) => {
		event.stopPropagation()
	}, [])

	const onSpinner = (delta: number) => {
		const newValue = value + delta
		onChange(newValue)
		setPendingValue(String(newValue))
		inputRef.current?.focus()
	}

	return (
		<NodeRow className="NodeInputRow">
			<Port shapeId={shapeId} portId={portId} />
			{isOutOfDate || valueFromPort === STOP_EXECUTION ? (
				<NodeValue value={isOutOfDate ? STOP_EXECUTION : valueFromPort} />
			) : (
				<input
					ref={inputRef}
					type="text"
					inputMode="decimal"
					disabled={valueFromPort != null}
					value={valueFromPort ?? pendingValue ?? value}
					onChange={(e) => {
						setPendingValue(e.currentTarget.value)
						const asNumber = Number(e.currentTarget.value.trim())
						if (Number.isNaN(asNumber)) return
						onChange(asNumber)
					}}
					onPointerDown={onPointerDown}
					onBlur={() => {
						setPendingValue(null)
						onBlur?.()
					}}
					onFocus={() => {
						editor.setSelectedShapes([shapeId])
					}}
				/>
			)}
			<div className="NodeInputRow-buttons">
				<TldrawUiButton
					title="decrement"
					type="icon"
					onPointerDown={onPointerDown}
					onClick={() => onSpinner(-1)}
				>
					<TldrawUiButtonIcon icon={<SubtractIcon />} />
				</TldrawUiButton>
				<TldrawUiButton
					title="increment"
					type="icon"
					onPointerDown={onPointerDown}
					onClick={() => onSpinner(1)}
				>
					<TldrawUiButtonIcon icon={<AddIcon />} />
				</TldrawUiButton>
			</div>
		</NodeRow>
	)
}

/**
 * Format a number to display with up to 5 significant figures, using suffixes for large numbers.
 */
function formatNumber(value: number): string {
	// Handle special cases
	if (value === 0) return '0'
	if (!isFinite(value)) return value.toString()

	const absValue = Math.abs(value)
	const sign = value < 0 ? '-' : ''

	// For very large numbers, use suffixes
	if (absValue >= 1_000_000_000) {
		return sign + (absValue / 1_000_000_000).toPrecision(3) + 'B'
	}
	if (absValue >= 1_000_000) {
		return sign + (absValue / 1_000_000).toPrecision(3) + 'M'
	}
	if (absValue >= 1_000) {
		return sign + (absValue / 1_000).toPrecision(3) + 'k'
	}

	// For smaller numbers, use up to 5 significant figures
	if (absValue >= 1) {
		// For numbers >= 1, limit to 5 significant figures
		return sign + absValue.toPrecision(5).replace(/\.?0+$/, '')
	} else if (absValue >= 0.001) {
		// For numbers between 0.001 and 1, show up to 5 significant figures
		return sign + absValue.toPrecision(3)
	} else {
		// For very small numbers, use scientific notation
		return value.toExponential(2)
	}
}

/**
 * A value within a node. If the value is STOP_EXECUTION, a placeholder is shown instead.
 */
export function NodeValue({ value }: { value: number | STOP_EXECUTION }) {
	if (value === STOP_EXECUTION) {
		return <div className="NodeValue_placeholder" />
	}

	return formatNumber(value)
}

export function areAnyInputsOutOfDate(inputs: InfoValues): boolean {
	return Object.values(inputs).some((input) => input.isOutOfDate)
}

// Node Menu Component - 节点右上角三点菜单
export function NodeMenu({
	shape,
	onDelete,
	onDuplicate,
	onSettings
}: {
	shape: NodeShape
	onDelete?: () => void
	onDuplicate?: () => void
	onSettings?: () => void
}) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div style={{ position: 'relative' }}>
			<button
				onClick={(e) => {
					e.stopPropagation()
					setIsOpen(!isOpen)
				}}
				onPointerDown={(e) => e.stopPropagation()}
				style={{
					width: '24px',
					height: '24px',
					padding: 0,
					border: 'none',
					background: 'transparent',
					borderRadius: '4px',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'rgba(0, 0, 0, 0.4)',
					transition: 'all 0.2s ease',
					pointerEvents: 'auto',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
					e.currentTarget.style.color = 'rgba(0, 0, 0, 0.7)'
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent'
					e.currentTarget.style.color = 'rgba(0, 0, 0, 0.4)'
				}}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="3" r="1.5" fill="currentColor"/>
					<circle cx="8" cy="8" r="1.5" fill="currentColor"/>
					<circle cx="8" cy="13" r="1.5" fill="currentColor"/>
				</svg>
			</button>

			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						onClick={() => setIsOpen(false)}
						style={{
							position: 'fixed',
							inset: 0,
							zIndex: 999,
						}}
					/>

					{/* Menu */}
					<div
						style={{
							position: 'absolute',
							top: '100%',
							right: 0,
							marginTop: '4px',
							background: 'white',
							borderRadius: '8px',
							boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
							border: '1px solid rgba(0, 0, 0, 0.08)',
							minWidth: '160px',
							overflow: 'hidden',
							zIndex: 1000,
							pointerEvents: 'auto',
						}}
					>
						{onSettings && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onSettings()
									setIsOpen(false)
								}}
								onPointerDown={(e) => e.stopPropagation()}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: 'none',
									background: 'transparent',
									textAlign: 'left',
									fontSize: '13px',
									color: 'rgba(0, 0, 0, 0.8)',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'background 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent'
								}}
							>
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<path d="M7 4.5V7M7 9.5H7.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									<circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
								</svg>
								配置
							</button>
						)}

						{onDuplicate && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onDuplicate()
									setIsOpen(false)
								}}
								onPointerDown={(e) => e.stopPropagation()}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: 'none',
									background: 'transparent',
									textAlign: 'left',
									fontSize: '13px',
									color: 'rgba(0, 0, 0, 0.8)',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'background 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent'
								}}
							>
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
									<path d="M3 10V3.5C3 2.67157 3.67157 2 4.5 2H10" stroke="currentColor" strokeWidth="1.3"/>
								</svg>
								复制
							</button>
						)}

						{onDelete && (
							<button
								onClick={(e) => {
									e.stopPropagation()
									onDelete()
									setIsOpen(false)
								}}
								onPointerDown={(e) => e.stopPropagation()}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: 'none',
									borderTop: '1px solid rgba(0, 0, 0, 0.06)',
									background: 'transparent',
									textAlign: 'left',
									fontSize: '13px',
									color: '#ef4444',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									transition: 'background 0.2s ease',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent'
								}}
							>
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<path d="M2 4H12M5 2H9M5 7V10M9 7V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
									<path d="M4 4L4.5 11C4.5 11.5523 4.94772 12 5.5 12H8.5C9.05228 12 9.5 11.5523 9.5 11L10 4" stroke="currentColor" strokeWidth="1.3"/>
								</svg>
								删除
							</button>
						)}
					</div>
				</>
			)}
		</div>
	)
}

// Loading Spinner Component - 加载动画
export function LoadingSpinner({ size = 20, color = '#3b82f6' }: { size?: number; color?: string }) {
	return (
		<div
			style={{
				width: size,
				height: size,
				border: `2px solid rgba(0, 0, 0, 0.1)`,
				borderTopColor: color,
				borderRadius: '50%',
				animation: 'spin 0.8s linear infinite',
			}}
		/>
	)
}

// Progress Bar Component - 进度条
export function ProgressBar({ progress, height = 4 }: { progress: number; height?: number }) {
	return (
		<div
			style={{
				width: '100%',
				height: `${height}px`,
				background: 'rgba(0, 0, 0, 0.06)',
				borderRadius: `${height / 2}px`,
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					width: `${progress}%`,
					height: '100%',
					background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
					borderRadius: `${height / 2}px`,
					transition: 'width 0.3s ease',
				}}
			/>
		</div>
	)
}

// Placeholder Image - 占位图（马赛克效果）
export function PlaceholderImage({
	width = 280,
	height = 280,
	text = ''
}: {
	width?: number
	height?: number
	text?: string
}) {
	return (
		<div
			style={{
				width: '100%',
				height: `${height}px`,
				background: `
					repeating-linear-gradient(
						0deg,
						rgba(0, 0, 0, 0.03) 0px,
						rgba(0, 0, 0, 0.03) 10px,
						transparent 10px,
						transparent 20px
					),
					repeating-linear-gradient(
						90deg,
						rgba(0, 0, 0, 0.03) 0px,
						rgba(0, 0, 0, 0.03) 10px,
						transparent 10px,
						transparent 20px
					),
					linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)
				`,
				borderRadius: '6px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '12px',
				fontWeight: 500,
				color: 'rgba(0, 0, 0, 0.3)',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* 图标 */}
			<svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.2 }}>
				<rect x="6" y="6" width="36" height="36" rx="3" stroke="currentColor" strokeWidth="2"/>
				<circle cx="15" cy="15" r="3" fill="currentColor"/>
				<path d="M6 32L14 24L22 32L30 24L42 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
			</svg>
			{text && (
				<div style={{
					position: 'absolute',
					bottom: '12px',
					left: '50%',
					transform: 'translateX(-50%)',
					background: 'rgba(255, 255, 255, 0.9)',
					padding: '6px 12px',
					borderRadius: '6px',
					fontSize: '11px',
					fontWeight: 600,
					color: 'rgba(0, 0, 0, 0.5)',
					whiteSpace: 'nowrap',
				}}>
					{text}
				</div>
			)}
		</div>
	)
}
