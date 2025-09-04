'use client'
import Shell from '@/components/Shell'
import ProtectedRoute from '@/components/ProtectedRoute'
import { EmptyState, Badge, StatCard } from '@/components/UI'
import { InboxIcon, CampaignsIcon, ContactsIcon, WhatsappIcon, LoadingIcon } from '@/components/Icons'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'

// Tipos para FlowNode
interface FlowNode {
  id: string
  type: 'start' | 'welcome' | 'message' | 'menu' | 'condition' | 'action' | 
        'menu_produtos' | 'menu_suporte' | 'menu_horarios' | 'condition_horario' | 
        'condition_usuario' | 'condition_tag' | 'action_transferir' | 'action_tag' | 
        'action_webhook' | 'action_delay' | 'action_salvar_dados' |
        // Novos tipos n8n-style
        'http_request' | 'if' | 'switch' | 'set' | 'function' | 'code' |
        'wait' | 'schedule' | 'email' | 'sms' | 'split' | 'merge' | 
        'filter' | 'sort' | 'aggregate' | 'transform' | 'validate' |
        'database' | 'api_call' | 'file_read' | 'file_write' | 'json_parse' |
        'xml_parse' | 'csv_parse' | 'regex' | 'date_time' | 'math' | 'random'
  title: string
  content: string
  position: { x: number; y: number }
  connections: string[]
  options?: { text: string; nextNodeId: string }[]
  conditions?: { field: string; operator: string; value: string; nextNodeId: string }[]
  actions?: { type: string; value: string; data?: any }[]
  tags?: string[]
  executeWhen?: string
  subType?: string
  // Propriedades específicas para nós n8n-style
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url?: string
  headers?: { [key: string]: string }
  body?: string
  credentials?: string
  timeout?: number
  retryCount?: number
  variables?: { name: string; value: any; type?: string }[]
  code?: string
  language?: 'javascript' | 'python' | 'json'
  schedule?: string
  emailTo?: string[]
  emailSubject?: string
  smsTo?: string
  splitBy?: 'field' | 'binary' | 'count'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  aggregateBy?: string
  aggregateFunction?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  transformRules?: { from: string; to: string }[]
  validationRules?: { field: string; rule: string; message: string }[]
  databaseQuery?: string
  filePath?: string
  regexPattern?: string
  mathOperation?: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sqrt'
  randomType?: 'number' | 'string' | 'boolean' | 'uuid'
  randomMin?: number
  randomMax?: number
}

interface ChatbotFlow {
  id: number
  name: string
  description?: string
  nodes: FlowNode[]
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  options?: string[]
}

export default function ChatbotPage() {
  const [flows, setFlows] = useState<ChatbotFlow[]>([])
  const [currentFlow, setCurrentFlow] = useState<ChatbotFlow | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [isCreatingFlow, setIsCreatingFlow] = useState(false)
  const [newFlowName, setNewFlowName] = useState('')
  const [newFlowDescription, setNewFlowDescription] = useState('')
  const [isSimulating, setIsSimulating] = useState(false)
  const toast = useToast()
  // Drag state
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  // Drag-to-connect
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null)
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  // Minimized nodes
  const [minimizedNodes, setMinimizedNodes] = useState<Set<string>>(new Set())
  // Node properties modal
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  // Zoom and pan controls
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  // Context menu for adding nodes
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })
  const [nodeCreationMode, setNodeCreationMode] = useState(false)
  // Node context menu (right-click on nodes)
  const [nodeContextMenu, setNodeContextMenu] = useState<{ 
    x: number; 
    y: number; 
    show: boolean; 
    nodeId: string | null;
    submenu: string | null;
  }>({ x: 0, y: 0, show: false, nodeId: null, submenu: null })
  // Clipboard for copy/cut/paste
  const [clipboard, setClipboard] = useState<{ node: FlowNode | null; operation: 'copy' | 'cut' | null }>({ 
    node: null, 
    operation: null 
  })
  
  // Inicia conexão visual
  const onStartConnect = (e: React.MouseEvent, node: FlowNode) => {
    if (!canvasRef.current) return
    e.stopPropagation()
    setConnectingFromId(node.id)
    setConnectLine({
      x1: node.position.x,
      y1: node.position.y,
      x2: node.position.x,
      y2: node.position.y
    })
    document.body.style.cursor = 'crosshair'
  }

  // Atualiza linha durante drag
  useEffect(() => {
    if (!connectingFromId) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      setConnectLine(line => line ? {
        ...line,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top
      } : null)
    }
    const handleMouseUp = (e: MouseEvent) => {
      setConnectingFromId(null)
      setConnectLine(null)
      document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }
  }, [connectingFromId])

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu.show) {
        setContextMenu(prev => ({ ...prev, show: false }))
      }
      if (nodeContextMenu.show) {
        setNodeContextMenu(prev => ({ ...prev, show: false, submenu: null }))
      }
    }

    if (contextMenu.show || nodeContextMenu.show) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.show, nodeContextMenu.show])

  // Keyboard shortcuts for clipboard operations
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && nodeContextMenu.nodeId) {
          e.preventDefault()
          copyNode(nodeContextMenu.nodeId)
        }
        if (e.key === 'x' && nodeContextMenu.nodeId) {
          e.preventDefault()
          cutNode(nodeContextMenu.nodeId)
        }
        if (e.key === 'v' && clipboard.node) {
          e.preventDefault()
          pasteNode()
        }
      }
      if (e.key === 'Delete' && nodeContextMenu.nodeId) {
        e.preventDefault()
        deleteNode(nodeContextMenu.nodeId)
        hideNodeContextMenu()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [nodeContextMenu.nodeId, clipboard.node])

  // Finaliza conexão ao soltar sobre outro nó
  const onFinishConnect = (e: React.MouseEvent, targetNode: FlowNode) => {
    if (!connectingFromId || !currentFlow) return
    e.stopPropagation()
    if (connectingFromId === targetNode.id) return // Não conecta em si mesmo
    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.map(n =>
        n.id === connectingFromId && !n.connections.includes(targetNode.id)
          ? { ...n, connections: [...n.connections, targetNode.id] }
          : n
      )
    }
    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    setConnectingFromId(null)
    setConnectLine(null)
    document.body.style.cursor = ''
  }

  // Zoom and pan controls
  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.25), 3))
  }

  const handleZoomIn = () => {
    console.log('Zoom In clicked, current level:', zoomLevel) // Debug
    handleZoom(0.1)
  }
  const handleZoomOut = () => {
    console.log('Zoom Out clicked, current level:', zoomLevel) // Debug
    handleZoom(-0.1)
  }
  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      console.log('Zoom delta:', delta, 'Current zoom:', zoomLevel) // Debug
      handleZoom(delta)
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    hideContextMenu() // Hide context menu on any click
    hideNodeContextMenu() // Hide node context menu on any click
    
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle mouse or Shift+Left click
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  // Fit all nodes in view - adjusted for infinite canvas
  const fitToView = () => {
    if (!currentFlow?.nodes.length) return
    
    const nodes = currentFlow.nodes
    const minX = Math.min(...nodes.map(n => n.position.x)) - 200
    const maxX = Math.max(...nodes.map(n => n.position.x)) + 200
    const minY = Math.min(...nodes.map(n => n.position.y)) - 200
    const maxY = Math.max(...nodes.map(n => n.position.y)) + 200
    
    const canvasWidth = canvasRef.current?.clientWidth || 800
    const canvasHeight = canvasRef.current?.clientHeight || 600
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const scaleX = canvasWidth / contentWidth
    const scaleY = canvasHeight / contentHeight
    const scale = Math.min(scaleX, scaleY, 1)
    
    setZoomLevel(scale)
    // Ajustar pan offset para o canvas infinito (compensar o offset de -50000px)
    setPanOffset({
      x: (canvasWidth - contentWidth * scale) / 2 - (minX - 50000) * scale,
      y: (canvasHeight - contentHeight * scale) / 2 - (minY - 50000) * scale
    })
  }

  // Context menu functions
  const handleCanvasRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel
    
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true
    })
  }

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }

  const hideNodeContextMenu = () => {
    setNodeContextMenu(prev => ({ ...prev, show: false, submenu: null }))
  }

  // Handle right-click on nodes
  const handleNodeRightClick = (e: React.MouseEvent, node: FlowNode) => {
    e.preventDefault()
    e.stopPropagation()
    
    setNodeContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true,
      nodeId: node.id,
      submenu: null
    })
  }

  // Node operations
  const duplicateNode = (nodeId: string) => {
    if (!currentFlow) return
    const nodeToDuplicate = currentFlow.nodes.find(n => n.id === nodeId)
    if (!nodeToDuplicate) return

    const duplicatedNode: FlowNode = {
      ...nodeToDuplicate,
      id: `${nodeId}_copy_${Date.now()}`,
      title: `${nodeToDuplicate.title} (Cópia)`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50
      },
      connections: [] // Reset connections for duplicated node
    }

    const updatedFlow = {
      ...currentFlow,
      nodes: [...currentFlow.nodes, duplicatedNode]
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    hideNodeContextMenu()
    
    if (toast) {
      toast('Nó duplicado com sucesso!', 'success')
    }
  }

  const copyNode = (nodeId: string) => {
    const nodeToCopy = currentFlow?.nodes.find(n => n.id === nodeId)
    if (!nodeToCopy) return

    setClipboard({
      node: { ...nodeToCopy },
      operation: 'copy'
    })
    hideNodeContextMenu()
    
    if (toast) {
      toast('Nó copiado para área de transferência!', 'success')
    }
  }

  const cutNode = (nodeId: string) => {
    const nodeToCut = currentFlow?.nodes.find(n => n.id === nodeId)
    if (!nodeToCut || !currentFlow) return

    setClipboard({
      node: { ...nodeToCut },
      operation: 'cut'
    })

    // Remove node from flow (but keep in clipboard)
    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.filter(n => n.id !== nodeId)
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    hideNodeContextMenu()
    
    if (toast) {
      toast('Nó recortado!', 'error')
    }
  }

  const pasteNode = (x?: number, y?: number) => {
    if (!clipboard.node || !currentFlow) return

    const pastedNode: FlowNode = {
      ...clipboard.node,
      id: `${clipboard.node.id}_paste_${Date.now()}`,
      title: clipboard.operation === 'cut' ? clipboard.node.title : `${clipboard.node.title} (Colado)`,
      position: {
        x: x || clipboard.node.position.x + 30,
        y: y || clipboard.node.position.y + 30
      },
      connections: [] // Reset connections for pasted node
    }

    const updatedFlow = {
      ...currentFlow,
      nodes: [...currentFlow.nodes, pastedNode]
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    
    // Clear clipboard if it was a cut operation
    if (clipboard.operation === 'cut') {
      setClipboard({ node: null, operation: null })
    }
    
    hideNodeContextMenu()
    
    if (toast) {
      toast('Nó colado com sucesso!', 'success')
    }
  }

  const addNodeAtPosition = (nodeType: FlowNode['type'], x?: number, y?: number) => {
    if (!currentFlow) return

    const canvasRect = canvasRef.current?.getBoundingClientRect()
    // Posições centralizadas no canvas infinito (próximo ao centro visível)
    let nodeX = Math.random() * 400 + 49800 // Random próximo ao centro (50000 é o centro)
    let nodeY = Math.random() * 400 + 49800 // Random próximo ao centro (50000 é o centro)

    // If coordinates from context menu, convert them to infinite canvas coordinates
    if (x !== undefined && y !== undefined && canvasRect) {
      // Converte coordenadas do clique para o sistema de coordenadas infinito
      // Ajusta para o offset do canvas infinito
      nodeX = (x - panOffset.x) / zoomLevel + 50000 // Adiciona offset do canvas infinito (50000 é o centro)
      nodeY = (y - panOffset.y) / zoomLevel + 50000 // Adiciona offset do canvas infinito (50000 é o centro)
    }

    const newNode: FlowNode = {
      id: Date.now().toString(),
      type: nodeType,
      title: getNodeTypeTitle(nodeType),
      content: getNodeTypeDefaultContent(nodeType),
      position: { x: nodeX, y: nodeY },
      connections: [],
      ...(nodeType.includes('menu') && { options: [{ text: 'Opção 1', nextNodeId: '' }] }),
      ...(nodeType.includes('condition') && { conditions: [{ field: 'campo', operator: 'igual', value: '', nextNodeId: '' }] }),
      ...(nodeType.includes('action') && { actions: [{ type: 'transferir_atendente', value: '', data: {} }] })
    }

    const updatedFlow = {
      ...currentFlow,
      nodes: [...currentFlow.nodes, newNode]
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
    hideContextMenu()
    setNodeCreationMode(false)
    
    if (toast) {
      toast(`Nó ${getNodeTypeTitle(nodeType)} adicionado!`, 'success')
    }
  }

  // Toggle minimized state
  const toggleNodeMinimized = (nodeId: string) => {
    setMinimizedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  // Token JWT
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Carrega fluxos do backend
  useEffect(() => {
    loadFlows()
  }, [token])

  const loadFlows = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/chatbot/flows', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
      
      const data = await res.json()
      setFlows(data.flows || [])
      
      // Seleciona o primeiro fluxo ativo
      const activeFlow = data.flows?.find((f: ChatbotFlow) => f.active)
      if (activeFlow) {
        setCurrentFlow(activeFlow)
        initializeChat(activeFlow)
      }
    } catch (err: any) {
      console.error('Erro ao carregar fluxos:', err)
      if (toast) {
        toast(err.message || 'Erro ao carregar fluxos do chatbot', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const initializeChat = (flow: ChatbotFlow) => {
    const nodes = flow.nodes || []
    const welcomeNode = nodes.find(n => n.type === 'welcome') || nodes[0]
    
    if (welcomeNode) {
      setChatMessages([{
        id: '1',
        type: 'bot',
        content: welcomeNode.content || 'Olá! Bem-vindo ao nosso atendimento.',
        timestamp: new Date(),
        options: welcomeNode.type === 'menu' ? welcomeNode.options?.map(o => o.text) : undefined
      }])
      setCurrentNodeId(welcomeNode.id)
    } else {
      setChatMessages([{
        id: '1',
        type: 'bot',
        content: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?',
        timestamp: new Date()
      }])
    }
  }

  const createNewFlow = async () => {
    if (!newFlowName.trim()) return
    if (!token) {
      if (toast) toast('Você precisa estar autenticado para criar um fluxo.', 'error')
      return
    }

    const welcomeNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: 'welcome',
      title: 'Boas-vindas',
      content: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?',
      position: { x: 50000, y: 50000 }, // Centro do canvas infinito
      connections: []
    }

    try {
      const res = await fetch('/api/chatbot/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFlowName,
          description: newFlowDescription,
          nodes: [welcomeNode]
        })
      })
      if (!res.ok) {
        // Tenta extrair mensagem detalhada do backend
        let detail = ''
        try {
          const errData = await res.json()
          detail = errData?.message || JSON.stringify(errData)
        } catch {}
        throw new Error(`Erro ao criar fluxo${detail ? `: ${detail}` : ''}`)
      }
      
      const data = await res.json()
      const newFlow = data.flow
      
      setFlows(prev => [newFlow, ...prev])
      setCurrentFlow(newFlow)
      setIsCreatingFlow(false)
      setNewFlowName('')
      setNewFlowDescription('')
      if (toast) {
        toast('Fluxo criado com sucesso!', 'success')
      }
      initializeChat(newFlow)
    } catch (err: any) {
      if (toast) {
        toast(err.message || 'Erro ao criar fluxo', 'error')
      }
    }
  }

  const saveFlow = async () => {
    if (!currentFlow) return

    try {
      const res = await fetch(`/api/chatbot/flows/${currentFlow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: currentFlow.name,
          description: currentFlow.description,
          nodes: currentFlow.nodes,
          active: currentFlow.active
        })
      })

      if (!res.ok) throw new Error('Erro ao salvar fluxo')
      
      if (toast) {
        toast('Fluxo salvo com sucesso!', 'success')
      }
    } catch (err: any) {
      if (toast) {
        toast(err.message || 'Erro ao salvar fluxo', 'error')
      }
    }
  }

  const deleteFlow = async (flowId: number) => {
    if (!confirm('Deseja realmente excluir este fluxo?')) return

    try {
      const res = await fetch(`/api/chatbot/flows/${flowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) throw new Error('Erro ao excluir fluxo')
      
      setFlows(prev => prev.filter(f => f.id !== flowId))
      if (currentFlow?.id === flowId) {
        setCurrentFlow(null)
        setChatMessages([])
      }
      if (toast) {
        toast('Fluxo excluído com sucesso!', 'success')
      }
    } catch (err: any) {
      if (toast) {
        toast(err.message || 'Erro ao excluir fluxo', 'error')
      }
    }
  }

  const addNode = (type: FlowNode['type']) => {
    // Use addNodeAtPosition with random position for sidebar buttons
    const randomX = Math.random() * 400 + 200
    const randomY = Math.random() * 300 + 150
    addNodeAtPosition(type, randomX, randomY)
  }

  // Atualiza posição do nó durante o arraste
  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    if (!currentFlow) return
    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.map(n => n.id === nodeId ? { ...n, position } : n)
    }
    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  // Listeners globais para mousemove/mouseup quando arrastando
  useEffect(() => {
    if (!draggingNodeId) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !currentFlow || !draggingNodeId) return
      const rect = canvasRef.current.getBoundingClientRect()
      
      // Converter coordenadas do mouse para o sistema do canvas infinito
      const canvasX = (e.clientX - rect.left - panOffset.x) / zoomLevel
      const canvasY = (e.clientY - rect.top - panOffset.y) / zoomLevel
      
      // Ajustar pelo offset do canvas infinito (50000 é o novo centro)
      const finalX = canvasX + 50000 - dragOffsetRef.current.x / zoomLevel
      const finalY = canvasY + 50000 - dragOffsetRef.current.y / zoomLevel
      
      // Sem limites - canvas infinito!
      moveNode(draggingNodeId, { x: finalX, y: finalY })
    }

    const handleMouseUp = () => {
      setDraggingNodeId(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    // Evita seleção de texto durante drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [draggingNodeId, currentFlow])

  const onNodeMouseDown = (e: React.MouseEvent, node: FlowNode) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calcular posição atual do nó na tela (considerando zoom e pan)
    const nodeScreenX = (node.position.x - 50000) * zoomLevel + panOffset.x
    const nodeScreenY = (node.position.y - 50000) * zoomLevel + panOffset.y
    
    // Offset entre o cursor e o centro do nó na tela
    dragOffsetRef.current = { 
      x: mouseX - nodeScreenX, 
      y: mouseY - nodeScreenY 
    }
    setDraggingNodeId(node.id)
  }

  const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    if (!currentFlow) return

    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  const deleteNode = (nodeId: string) => {
    if (!currentFlow) return

    const updatedFlow = {
      ...currentFlow,
      nodes: currentFlow.nodes.filter(node => node.id !== nodeId)
    }

    setCurrentFlow(updatedFlow)
    setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
  }

  const handleSimulateMessage = async () => {
    if (!userInput.trim() || !currentFlow || isSimulating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const inputText = userInput
    setUserInput('')
    setIsSimulating(true)

    try {
      const res = await fetch(`/api/chatbot/flows/${currentFlow.id}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userMessage: inputText,
          currentNodeId
        })
      })

      if (res.ok) {
        const data = await res.json()
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.response.message,
          timestamp: new Date(),
          options: data.response.options
        }

        setChatMessages(prev => [...prev, botMessage])
        setCurrentNodeId(data.response.nextNodeId)
      }
    } catch (err) {
      console.error('Erro na simulação:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const resetChat = () => {
    if (currentFlow) {
      initializeChat(currentFlow)
    }
  }

  const getNodeTypeTitle = (type: FlowNode['type']): string => {
    const titles = {
      start: 'Início',
      welcome: 'Boas-vindas',
      message: 'Mensagem',
      menu: 'Menu Básico',
      condition: 'Condição Básica',
      action: 'Ação Básica',
      // Menus específicos
      menu_produtos: 'Menu Produtos',
      menu_suporte: 'Menu Suporte',
      menu_horarios: 'Menu Horários',
      // Condições específicas
      condition_horario: 'Condição Horário',
      condition_usuario: 'Condição Usuário',
      condition_tag: 'Condição Tag',
      // Ações específicas
      action_transferir: 'Transferir Atendimento',
      action_tag: 'Adicionar Tag',
      action_webhook: 'Webhook',
      action_delay: 'Delay/Aguardar',
      action_salvar_dados: 'Salvar Dados',
      // Tipos n8n-style
      http_request: 'HTTP Request',
      if: 'IF Condition',
      switch: 'Switch',
      set: 'Set Variables',
      function: 'Function',
      code: 'Code',
      wait: 'Wait/Delay',
      schedule: 'Schedule Trigger',
      email: 'Send Email',
      sms: 'Send SMS',
      split: 'Split in Batches',
      merge: 'Merge Data',
      filter: 'Filter',
      sort: 'Sort',
      aggregate: 'Aggregate',
      transform: 'Transform Data',
      validate: 'Validate Data',
      database: 'Database',
      api_call: 'API Call',
      file_read: 'Read File',
      file_write: 'Write File',
      json_parse: 'Parse JSON',
      xml_parse: 'Parse XML',
      csv_parse: 'Parse CSV',
      regex: 'Regular Expression',
      date_time: 'Date & Time',
      math: 'Math Operation',
      random: 'Random Data'
    }
    return titles[type] || type
  }

  const getNodeTypeDefaultContent = (type: FlowNode['type']): string => {
    const contents = {
      start: 'Ponto de entrada do fluxo',
      welcome: 'Olá! Bem-vindo ao nosso atendimento.',
      message: 'Digite sua mensagem aqui...',
      menu: 'Escolha uma das opções abaixo:',
      condition: 'Condição será avaliada...',
      action: 'Ação será executada...',
      // Menus específicos
      menu_produtos: 'Conheça nossos produtos e serviços:',
      menu_suporte: 'Como posso ajudar você hoje?',
      menu_horarios: 'Nossos horários de atendimento:',
      // Condições específicas
      condition_horario: 'Verificar se está dentro do horário comercial',
      condition_usuario: 'Verificar informações do usuário',
      condition_tag: 'Verificar se usuário possui tag específica',
      // Ações específicas
      action_transferir: 'Transferir para atendente humano',
      action_tag: 'Adicionar tag ao usuário',
      action_webhook: 'Executar webhook externo',
      action_delay: 'Aguardar 5 segundos...',
      action_salvar_dados: 'Salvar dados do usuário',
      // Tipos n8n-style
      http_request: 'Fazer requisição HTTP para API externa',
      if: 'Avaliar condição verdadeiro/falso',
      switch: 'Escolher entre múltiplas condições',
      set: 'Definir variáveis e valores',
      function: 'Executar função JavaScript personalizada',
      code: 'Executar código customizado',
      wait: 'Aguardar tempo específico',
      schedule: 'Executar em horário agendado',
      email: 'Enviar email para destinatários',
      sms: 'Enviar SMS para contatos',
      split: 'Dividir dados em lotes',
      merge: 'Combinar múltiplos dados',
      filter: 'Filtrar dados por critérios',
      sort: 'Ordenar dados por campo',
      aggregate: 'Agregar e sumarizar dados',
      transform: 'Transformar estrutura de dados',
      validate: 'Validar dados de entrada',
      database: 'Executar query no banco',
      api_call: 'Chamar API externa',
      file_read: 'Ler arquivo do sistema',
      file_write: 'Escrever arquivo no sistema',
      json_parse: 'Converter JSON para objeto',
      xml_parse: 'Converter XML para objeto',
      csv_parse: 'Converter CSV para array',
      regex: 'Aplicar expressão regular',
      date_time: 'Manipular data e hora',
      math: 'Executar operação matemática',
      random: 'Gerar dados aleatórios'
    }
    return contents[type] || 'Configurar ação...'
  }

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-400/50'
      case 'message': return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-400/50'
      case 'menu':
      case 'menu_produtos':
      case 'menu_suporte': 
      case 'menu_horarios': return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-400/50'
      case 'condition':
      case 'condition_horario':
      case 'condition_usuario':
      case 'condition_tag': return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-400/50'
      case 'action':
      case 'action_transferir':
      case 'action_tag':
      case 'action_webhook':
      case 'action_delay':
      case 'action_salvar_dados': return 'bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-400/50'
      default: return 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/50'
    }
  }

  const getNodeGlowColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-emerald-500/30'
      case 'message': return 'bg-blue-500/30'
      case 'menu':
      case 'menu_produtos':
      case 'menu_suporte': 
      case 'menu_horarios': return 'bg-purple-500/30'
      case 'condition':
      case 'condition_horario':
      case 'condition_usuario':
      case 'condition_tag': return 'bg-yellow-500/30'
      case 'action':
      case 'action_transferir':
      case 'action_tag':
      case 'action_webhook':
      case 'action_delay':
      case 'action_salvar_dados': return 'bg-red-500/30'
      default: return 'bg-slate-600/30'
    }
  }

  const getNodeIconBg = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-emerald-500/30 border border-emerald-400/50'
      case 'message': return 'bg-blue-500/30 border border-blue-400/50'
      case 'menu':
      case 'menu_produtos':
      case 'menu_suporte': 
      case 'menu_horarios': return 'bg-purple-500/30 border border-purple-400/50'
      case 'condition':
      case 'condition_horario':
      case 'condition_usuario':
      case 'condition_tag': return 'bg-yellow-500/30 border border-yellow-400/50'
      case 'action':
      case 'action_transferir':
      case 'action_tag':
      case 'action_webhook':
      case 'action_delay':
      case 'action_salvar_dados': return 'bg-red-500/30 border border-red-400/50'
      default: return 'bg-slate-600/30 border border-slate-500/50'
    }
  }

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <WhatsappIcon className="w-4 h-4" />
      case 'message': return <InboxIcon className="w-4 h-4" />
      case 'menu': return <CampaignsIcon className="w-4 h-4" />
      case 'menu_produtos': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
      case 'menu_suporte': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
      case 'menu_horarios': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
      case 'condition':
      case 'condition_horario':
      case 'condition_usuario':
      case 'condition_tag': return <ContactsIcon className="w-4 h-4" />
      case 'action': return <LoadingIcon className="w-4 h-4" />
      case 'action_transferir': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
      case 'action_tag': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
      case 'action_webhook': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0-10.102l1.102-1.102a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.102" />
        </svg>
      )
      case 'action_delay': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
      case 'action_salvar_dados': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      )
      default: return <InboxIcon className="w-4 h-4" />
    }
  }

  const totalNodes = currentFlow?.nodes?.length || 0
  const activeFlows = flows.filter(f => f.active).length

  return (
    <ProtectedRoute>
      <Shell>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                Chatbot & Automação
              </h1>
              <p className="text-text-muted mt-1">
                Crie fluxos automatizados para atendimento 24/7
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentFlow && flows.length > 1 && (
                <select 
                  value={currentFlow.id} 
                  onChange={(e) => {
                    const flow = flows.find(f => f.id === parseInt(e.target.value))
                    if (flow) {
                      setCurrentFlow(flow)
                      initializeChat(flow)
                    }
                  }}
                  className="input"
                >
                  {flows.map(flow => (
                    <option key={flow.id} value={flow.id}>{flow.name}</option>
                  ))}
                </select>
              )}
              {currentFlow && (
                <button onClick={saveFlow} className="btn btn-secondary">
                  <LoadingIcon className="w-4 h-4 mr-2" />
                  Salvar
                </button>
              )}
              <button onClick={() => setIsCreatingFlow(true)} className="btn btn-primary">
                <CampaignsIcon className="w-4 h-4 mr-2" />
                Novo Fluxo
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Fluxos Ativos"
              value={activeFlows}
              icon={<CampaignsIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Total de Nós"
              value={totalNodes}
              change={{ value: `+${totalNodes}`, positive: true }}
              icon={<InboxIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Conversas Automatizadas"
              value="89%"
              change={{ value: '+5%', positive: true }}
              icon={<WhatsappIcon className="w-6 h-6" />}
            />
            <StatCard
              title="Taxa de Resolução"
              value="94%"
              change={{ value: '+2%', positive: true }}
              icon={<ContactsIcon className="w-6 h-6" />}
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <LoadingIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Carregando fluxos...</p>
            </div>
          ) : !currentFlow ? (
            <EmptyState
              icon={<InboxIcon className="w-10 h-10" />}
              title="Nenhum fluxo criado"
              description="Crie seu primeiro fluxo de chatbot para começar"
              action={{
                label: "Criar Primeiro Fluxo",
                onClick: () => setIsCreatingFlow(true)
              }}
            />
          ) : (
            <>
              {/* Main Content Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Flow Canvas */}
                <section className="col-span-8 card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Editor de Fluxo: {currentFlow.name}</h3>
                    <div className="flex items-center gap-2">
                      {/* Zoom Controls */}
                      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                        <button
                          onClick={handleZoomOut}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Diminuir zoom (Ctrl + Scroll)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                          </svg>
                        </button>
                        <span className="text-xs text-slate-400 px-2 min-w-[3rem] text-center">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          onClick={handleZoomIn}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Aumentar zoom (Ctrl + Scroll)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleResetZoom}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Resetar zoom (100%)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={fitToView}
                          className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                          title="Ajustar à tela"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </button>
                      </div>

                      {/* Minimize/Expand all buttons */}
                      <button
                        onClick={() => setMinimizedNodes(new Set(currentFlow.nodes.map(n => n.id)))}
                        className="btn btn-outline btn-sm"
                        title="Minimizar todos os nós"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Minimizar Todos
                      </button>
                      <button
                        onClick={() => setMinimizedNodes(new Set())}
                        className="btn btn-outline btn-sm"
                        title="Expandir todos os nós"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Expandir Todos
                      </button>
                      <Badge variant={currentFlow.active ? "success" : "warning"}>
                        {currentFlow.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <button 
                        onClick={() => {
                          const updatedFlow = { ...currentFlow, active: !currentFlow.active }
                          setCurrentFlow(updatedFlow)
                          setFlows(prev => prev.map(f => f.id === currentFlow.id ? updatedFlow : f))
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        {currentFlow.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>

                  {/* Canvas Container - Infinite interno, contido visualmente */}
                  <div className="relative h-[600px] rounded-xl mb-4" style={{ 
                    overflow: 'hidden', // Contém visualmente dentro do editor
                    isolation: 'isolate'
                  }}>
                    <div 
                      ref={canvasRef} 
                      className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700/50"
                      onWheel={handleWheel}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onContextMenu={handleCanvasRightClick}
                      style={{ 
                        cursor: isPanning ? 'grabbing' : 'default',
                        overflow: 'hidden' // Garante que o conteúdo não vaze
                      }}
                    >
                    {/* Zoom and Pan Container - Infinite Canvas */}
                    <div 
                      className="absolute origin-top-left"
                      style={{
                        transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                        width: '100000px',  // Canvas muito mais amplo
                        height: '100000px', // Canvas muito mais alto
                        left: '-50000px',   // Centralizado
                        top: '-50000px',    // Centralizado
                        pointerEvents: 'auto',
                        transformOrigin: '0 0'
                      }}
                    >
                      {/* Infinite Grid pattern background */}
                      <div 
                        className="absolute opacity-20" 
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                          `,
                          backgroundSize: '20px 20px',
                          width: '100000px',
                          height: '100000px',
                          left: '0',
                          top: '0'
                        }}
                      />
                      
                      {/* Major grid lines every 100px for reference */}
                      <div 
                        className="absolute opacity-30" 
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(148, 163, 184, 0.2) 2px, transparent 2px),
                            linear-gradient(90deg, rgba(148, 163, 184, 0.2) 2px, transparent 2px)
                          `,
                          backgroundSize: '100px 100px',
                          width: '100000px',
                          height: '100000px',
                          left: '0',
                          top: '0'
                        }}
                      />
                      
                      {/* Flow nodes */}
                      {currentFlow.nodes.map(node => (
                        <div
                          key={node.id}
                          onMouseDown={(e) => onNodeMouseDown(e, node)}
                          onContextMenu={(e) => handleNodeRightClick(e, node)}
                          className={`absolute transition-all duration-300 ease-out hover:scale-110 hover:z-20 z-10 ${draggingNodeId === node.id ? 'z-40 scale-105' : ''}`}
                          style={{
                            left: node.position.x,
                          top: node.position.y,
                          transform: 'translate(-50%, -50%)',
                          filter: draggingNodeId === node.id ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                          pointerEvents: 'auto',
                          zIndex: draggingNodeId === node.id ? 9999 : 'auto'
                        }}
                      >
                        {/* Node shadow/glow effect */}
                        <div className={`absolute inset-0 rounded-xl blur-sm opacity-40 ${getNodeGlowColor(node.type)}`}></div>
                        
                        {/* Main node container */}
                        <div className={`relative ${minimizedNodes.has(node.id) ? 'min-w-32' : 'min-w-56'} p-4 border-2 rounded-xl backdrop-blur-sm ${getNodeTypeColor(node.type)} ${draggingNodeId === node.id ? 'cursor-grabbing' : 'cursor-grab'} transition-all duration-200`}>
                          
                          {/* Node header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${getNodeIconBg(node.type)}`}>
                              {getNodeTypeIcon(node.type)}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-white block">{node.title}</span>
                              <span className="text-xs text-slate-400 capitalize">{node.type}</span>
                            </div>
                            
                            {/* Node controls */}
                            <div className="flex items-center gap-1">
                              {/* Edit properties button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingNodeId(node.id)
                                }}
                                className="p-1 rounded hover:bg-blue-500/20 hover:border hover:border-blue-500/50 transition-colors"
                                title="Editar propriedades"
                              >
                                <svg className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNode(node.id)
                                }}
                                className="p-1 rounded hover:bg-red-500/20 hover:border hover:border-red-500/50 transition-colors group"
                                title="Excluir nó"
                              >
                                <svg className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              
                              {/* Minimize/Maximize button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleNodeMinimized(node.id)
                                }}
                                className="p-1 rounded hover:bg-slate-600/50 transition-colors"
                                title={minimizedNodes.has(node.id) ? "Expandir nó" : "Minimizar nó"}
                              >
                                <svg className="w-4 h-4 text-slate-400 hover:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {minimizedNodes.has(node.id) ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  )}
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded content */}
                          {!minimizedNodes.has(node.id) && (
                            <>
                              {/* Node content */}
                              <p className="text-xs text-slate-200 mb-3 line-clamp-2 leading-relaxed">{node.content}</p>
                              
                              {/* Tags */}
                              {node.tags && node.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap mb-2">
                                  {node.tags.map((tag, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-slate-600/50 text-slate-300 border border-slate-500/50">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Execute When */}
                              {node.executeWhen && (
                                <div className="mb-2">
                                  <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30">
                                    ⚡ {node.executeWhen}
                                  </span>
                                </div>
                              )}
                              
                              {/* Node options */}
                              {node.options && (
                                <div className="mb-3 space-y-1">
                                  {node.options.slice(0, 3).map((option, idx) => (
                                    <div key={idx} className="text-xs text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 backdrop-blur-sm">
                                      {option.text}
                                    </div>
                                  ))}
                                  {node.options.length > 3 && (
                                    <div className="text-xs text-slate-400 px-3 py-1">
                                      +{node.options.length - 3} mais opções...
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Conditions preview */}
                              {node.conditions && node.conditions.length > 0 && (
                                <div className="mb-3 space-y-1">
                                  {node.conditions.slice(0, 2).map((condition, idx) => (
                                    <div key={idx} className="text-xs text-yellow-300 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
                                      {condition.field} {condition.operator} {condition.value}
                                    </div>
                                  ))}
                                  {node.conditions.length > 2 && (
                                    <div className="text-xs text-slate-400 px-3 py-1">
                                      +{node.conditions.length - 2} mais condições...
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions preview */}
                              {node.actions && node.actions.length > 0 && (
                                <div className="mb-3 space-y-1">
                                  {node.actions.slice(0, 2).map((action, idx) => (
                                    <div key={idx} className="text-xs text-red-300 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30 backdrop-blur-sm">
                                      {action.type}: {action.value}
                                    </div>
                                  ))}
                                  {node.actions.length > 2 && (
                                    <div className="text-xs text-slate-400 px-3 py-1">
                                      +{node.actions.length - 2} mais ações...
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Minimized content - just connection count */}
                          {minimizedNodes.has(node.id) && (
                            <div className="text-center">
                              <span className="text-xs text-slate-400">
                                {node.connections.length} conexões
                              </span>
                            </div>
                          )}
                          
                          {/* Connection ports */}
                          <div className="flex justify-between items-center">
                            {/* Input port */}
                            <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-400 hover:border-emerald-400 transition-colors cursor-pointer" 
                                 title="Input"></div>
                            
                            {/* Connect button - only show when expanded */}
                            {!minimizedNodes.has(node.id) && (
                              <button
                                className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                                onMouseDown={(e) => onStartConnect(e, node)}
                              >
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0-10.102l1.102-1.102a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.102" />
                                  </svg>
                                  Connect
                                </span>
                              </button>
                            )}
                            
                            {/* Minimized connect button */}
                            {minimizedNodes.has(node.id) && (
                              <button
                                className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200"
                                onMouseDown={(e) => onStartConnect(e, node)}
                                title="Conectar"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0-10.102l1.102-1.102a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.102" />
                                </svg>
                              </button>
                            )}
                            
                            {/* Output port */}
                            <div className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-400 hover:border-orange-400 transition-colors cursor-pointer" 
                                 title="Output"></div>
                          </div>
                        </div>
                        
                        {/* Drop zone during connection */}
                        {connectingFromId && connectingFromId !== node.id && (
                          <div
                            className="absolute inset-0 z-50 rounded-xl border-2 border-dashed border-orange-400 bg-orange-500/10 backdrop-blur-sm"
                            onMouseUp={(e) => onFinishConnect(e, node)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-orange-300 font-medium">Drop to connect</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Connections + linha de drag-to-connect */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <marker id="arrowhead" markerWidth="12" markerHeight="8" 
                          refX="11" refY="4" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,8 L12,4 z" fill="#34d399" />
                        </marker>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Existing connections */}
                      {currentFlow.nodes.map(node => 
                        node.connections.map(targetId => {
                          const targetNode = currentFlow.nodes.find(n => n.id === targetId)
                          if (!targetNode) return null
                          
                          // Calculate bezier curve for smoother connections
                          const x1 = node.position.x + 90 // Right side of source node
                          const y1 = node.position.y
                          const x2 = targetNode.position.x - 90 // Left side of target node
                          const y2 = targetNode.position.y
                          const cx1 = x1 + (x2 - x1) * 0.5
                          const cx2 = x2 - (x2 - x1) * 0.5
                          
                          return (
                            <g key={`${node.id}-${targetId}`}>
                              {/* Connection glow */}
                              <path
                                d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                                stroke="#34d399"
                                strokeWidth="6"
                                fill="none"
                                opacity="0.3"
                                filter="url(#glow)"
                              />
                              {/* Main connection line */}
                              <path
                                d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                                stroke="#34d399"
                                strokeWidth="2"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                className="animate-pulse"
                                style={{
                                  strokeDasharray: "20 5",
                                  animation: "dash 2s linear infinite"
                                }}
                              />
                            </g>
                          )
                        })
                      )}
                      
                      {/* Drag-to-connect line */}
                      {connectLine && (
                        <g>
                          <line
                            x1={connectLine.x1 + 90}
                            y1={connectLine.y1}
                            x2={connectLine.x2}
                            y2={connectLine.y2}
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeDasharray="8 4"
                            opacity="0.8"
                            filter="url(#glow)"
                          />
                          <circle
                            cx={connectLine.x2}
                            cy={connectLine.y2}
                            r="4"
                            fill="#f59e0b"
                            opacity="0.8"
                          />
                        </g>
                      )}
                    </svg>

                    {/* Context Menu for adding nodes */}
                    {contextMenu.show && (
                      <div 
                        className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 p-2 min-w-[240px]"
                        style={{ 
                          left: contextMenu.x, 
                          top: contextMenu.y,
                          transform: 'translate(-50%, 0)' 
                        }}
                      >
                        <div className="text-xs text-slate-300 font-medium mb-2 px-2">Adicionar Nó</div>
                        
                        {/* Basic Nodes */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide px-2 mb-1">Básicos</div>
                          <button
                            onClick={() => addNodeAtPosition('message', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <InboxIcon className="w-3 h-3 text-blue-400" />
                            <span className="text-slate-200">Mensagem</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('menu', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <CampaignsIcon className="w-3 h-3 text-purple-400" />
                            <span className="text-slate-200">Menu</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('condition', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <ContactsIcon className="w-3 h-3 text-yellow-400" />
                            <span className="text-slate-200">Condição</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('action', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <LoadingIcon className="w-3 h-3 text-red-400" />
                            <span className="text-slate-200">Ação</span>
                          </button>
                        </div>

                        <div className="border-t border-slate-600 my-2"></div>

                        {/* Advanced n8n-style nodes */}
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide px-2 mb-1">Integração</div>
                          <button
                            onClick={() => addNodeAtPosition('http_request', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                            </svg>
                            <span className="text-slate-200">HTTP Request</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('database', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            <span className="text-slate-200">Database</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide px-2 mb-1">Lógica</div>
                          <button
                            onClick={() => addNodeAtPosition('if', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-200">IF Condition</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('function', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="text-slate-200">Function</span>
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide px-2 mb-1">Utilitários</div>
                          <button
                            onClick={() => addNodeAtPosition('wait', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-200">Wait</span>
                          </button>
                          <button
                            onClick={() => addNodeAtPosition('transform', contextMenu.x, contextMenu.y)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                          >
                            <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-slate-200">Transform</span>
                          </button>
                        </div>
                      </div>
                    )}



                    {/* Node Context Menu (right-click on nodes) */}
                    {nodeContextMenu.show && nodeContextMenu.nodeId && (
                      <div 
                        className="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[100] p-2 min-w-[200px]"
                        style={{ 
                          left: nodeContextMenu.x, 
                          top: nodeContextMenu.y,
                          transform: 'translate(-50%, 0)' 
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!nodeContextMenu.submenu ? (
                          // Main menu
                          <>
                            <div className="text-xs text-slate-300 font-medium mb-2 px-2">
                              {(() => {
                                const node = currentFlow?.nodes.find(n => n.id === nodeContextMenu.nodeId)
                                return node ? node.title : 'Opções do Nó'
                              })()}
                            </div>
                            
                            <button
                              onClick={() => setEditingNodeId(nodeContextMenu.nodeId)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="text-slate-200">Editar Propriedades</span>
                            </button>

                            <button
                              onClick={() => duplicateNode(nodeContextMenu.nodeId!)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-slate-200">Duplicar</span>
                            </button>

                            <div className="border-t border-slate-600 my-1"></div>

                            <button
                              onClick={() => setNodeContextMenu(prev => ({ ...prev, submenu: 'clipboard' }))}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span className="text-slate-200">Área de Transferência</span>
                              <svg className="w-3 h-3 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            <button
                              onClick={() => setNodeContextMenu(prev => ({ ...prev, submenu: 'appearance' }))}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a4 4 0 004 4z" />
                              </svg>
                              <span className="text-slate-200">Aparência</span>
                              <svg className="w-3 h-3 text-slate-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            <div className="border-t border-slate-600 my-1"></div>

                            <button
                              onClick={() => deleteNode(nodeContextMenu.nodeId!)}
                              className="w-full text-left px-3 py-2 hover:bg-red-600/20 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="text-red-400">Excluir Nó</span>
                            </button>
                          </>
                        ) : nodeContextMenu.submenu === 'clipboard' ? (
                          // Clipboard submenu
                          <>
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <button
                                onClick={() => setNodeContextMenu(prev => ({ ...prev, submenu: null }))}
                                className="p-1 hover:bg-slate-700 rounded"
                              >
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <div className="text-xs text-slate-300 font-medium">Área de Transferência</div>
                            </div>
                            
                            <button
                              onClick={() => copyNode(nodeContextMenu.nodeId!)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-slate-200">Copiar</span>
                              <span className="text-xs text-slate-400 ml-auto">Ctrl+C</span>
                            </button>

                            <button
                              onClick={() => cutNode(nodeContextMenu.nodeId!)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M9 16v-6a2 2 0 012-2h2a2 2 0 012 2v6M12 16v1" />
                              </svg>
                              <span className="text-slate-200">Recortar</span>
                              <span className="text-xs text-slate-400 ml-auto">Ctrl+X</span>
                            </button>

                            <button
                              onClick={() => pasteNode()}
                              disabled={!clipboard.node}
                              className={`w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm ${!clipboard.node ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              <span className="text-slate-200">Colar</span>
                              <span className="text-xs text-slate-400 ml-auto">Ctrl+V</span>
                            </button>
                          </>
                        ) : nodeContextMenu.submenu === 'appearance' ? (
                          // Appearance submenu
                          <>
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <button
                                onClick={() => setNodeContextMenu(prev => ({ ...prev, submenu: null }))}
                                className="p-1 hover:bg-slate-700 rounded"
                              >
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <div className="text-xs text-slate-300 font-medium">Aparência</div>
                            </div>
                            
                            <button
                              onClick={() => {
                                const nodeId = nodeContextMenu.nodeId!
                                if (minimizedNodes.has(nodeId)) {
                                  toggleNodeMinimized(nodeId)
                                } else {
                                  toggleNodeMinimized(nodeId)
                                }
                                hideNodeContextMenu()
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                              <span className="text-slate-200">
                                {minimizedNodes.has(nodeContextMenu.nodeId!) ? 'Expandir' : 'Minimizar'}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                // Reset node position to center
                                const nodeId = nodeContextMenu.nodeId!
                                moveNode(nodeId, { x: 50000, y: 50000 }) // Centro do canvas infinito
                                hideNodeContextMenu()
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
                            >
                              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              <span className="text-slate-200">Centralizar</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    )}

                    </div> {/* Fecha Zoom and Pan Container */}
                    </div> {/* Fecha Canvas Container interno */}
                    
                    {/* Floating Add Node Button - Fixed Position */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const rect = canvasRef.current?.getBoundingClientRect()
                        if (rect) {
                          setContextMenu({
                            x: rect.width / 2,
                            y: rect.height / 2,
                            show: true
                          })
                        }
                      }}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
                      title="Adicionar nó (clique direito no canvas)"
                    >
                      <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div> {/* Fecha Canvas Container externo */}

                  {/* Add Node Buttons */}
                  <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-sm text-slate-300 font-medium">Adicionar Nós:</div>
                    
                    {/* Mensagens e Básicos */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Básicos</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('message')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <InboxIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-300">Mensagem</span>
                        </button>
                      </div>
                    </div>

                    {/* Menus */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Menus</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('menu')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <CampaignsIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-300">Menu Básico</span>
                        </button>
                        <button 
                          onClick={() => addNode('menu_produtos')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="text-purple-300">Produtos</span>
                        </button>
                        <button 
                          onClick={() => addNode('menu_suporte')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-purple-300">Suporte</span>
                        </button>
                        <button 
                          onClick={() => addNode('menu_horarios')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-purple-700/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-purple-300">Horários</span>
                        </button>
                      </div>
                    </div>

                    {/* Condições */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Condições</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('condition')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <ContactsIcon className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-300">Básica</span>
                        </button>
                        <button 
                          onClick={() => addNode('condition_horario')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-yellow-300">Horário</span>
                        </button>
                        <button 
                          onClick={() => addNode('condition_usuario')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-yellow-300">Usuário</span>
                        </button>
                        <button 
                          onClick={() => addNode('condition_tag')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 hover:from-yellow-500/30 hover:to-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-yellow-300">Tag</span>
                        </button>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Ações</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('action')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <LoadingIcon className="w-4 h-4 text-red-400" />
                          <span className="text-red-300">Básica</span>
                        </button>
                        <button 
                          onClick={() => addNode('action_transferir')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-red-300">Transferir</span>
                        </button>
                        <button 
                          onClick={() => addNode('action_tag')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-red-300">Add Tag</span>
                        </button>
                        <button 
                          onClick={() => addNode('action_webhook')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m0-10.102l1.102-1.102a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102 1.102" />
                          </svg>
                          <span className="text-red-300">Webhook</span>
                        </button>
                        <button 
                          onClick={() => addNode('action_delay')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-red-300">Delay</span>
                        </button>
                        <button 
                          onClick={() => addNode('action_salvar_dados')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          <span className="text-red-300">Salvar Dados</span>
                        </button>
                      </div>
                    </div>

                    {/* Nós n8n-style - Integração & API */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Integração & API</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('http_request')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600/20 to-green-700/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          <span className="text-green-300">HTTP Request</span>
                        </button>
                        <button 
                          onClick={() => addNode('api_call')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600/20 to-green-700/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-green-300">API Call</span>
                        </button>
                        <button 
                          onClick={() => addNode('database')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600/20 to-green-700/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          <span className="text-green-300">Database</span>
                        </button>
                      </div>
                    </div>

                    {/* Lógica & Controle */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Lógica & Controle</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('if')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-amber-300">IF</span>
                        </button>
                        <button 
                          onClick={() => addNode('switch')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-amber-300">Switch</span>
                        </button>
                        <button 
                          onClick={() => addNode('function')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span className="text-amber-300">Function</span>
                        </button>
                        <button 
                          onClick={() => addNode('code')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-amber-700/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-amber-300">Code</span>
                        </button>
                      </div>
                    </div>

                    {/* Processamento de Dados */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Processamento</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('transform')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-indigo-300">Transform</span>
                        </button>
                        <button 
                          onClick={() => addNode('filter')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span className="text-indigo-300">Filter</span>
                        </button>
                        <button 
                          onClick={() => addNode('sort')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                          </svg>
                          <span className="text-indigo-300">Sort</span>
                        </button>
                        <button 
                          onClick={() => addNode('aggregate')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border border-indigo-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-indigo-300">Aggregate</span>
                        </button>
                      </div>
                    </div>

                    {/* Utilitários */}
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 uppercase tracking-wide">Utilitários</div>
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          onClick={() => addNode('wait')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-300">Wait</span>
                        </button>
                        <button 
                          onClick={() => addNode('schedule')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-300">Schedule</span>
                        </button>
                        <button 
                          onClick={() => addNode('random')} 
                          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 rounded-lg transition-all duration-200 hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-gray-300">Random</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Chat Simulator */}
                <aside className="col-span-4 card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Simulador</h3>
                    <div className="flex gap-2">
                      <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800/50 rounded">
                        Ctrl+Scroll: Zoom | Shift+Click: Pan
                      </span>
                      <button onClick={resetChat} className="btn btn-outline btn-sm">
                        Reiniciar
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="h-80 bg-slate-800/30 rounded-lg p-4 mb-4 overflow-y-auto">
                    <div className="space-y-3">
                      {chatMessages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs p-3 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-emerald-500 text-white ml-4' 
                              : 'bg-slate-700 text-slate-200 mr-4'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            {message.options && (
                              <div className="mt-2 space-y-1">
                                {message.options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setUserInput(option)}
                                    className="block w-full text-left text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded"
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                            <p className="text-xs mt-1 opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isSimulating && (
                        <div className="flex justify-start">
                          <div className="bg-slate-700 text-slate-200 p-3 rounded-lg mr-4">
                            <LoadingIcon className="w-4 h-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSimulateMessage()}
                      placeholder="Digite uma mensagem..."
                      className="input flex-1"
                      disabled={isSimulating}
                    />
                    <button 
                      onClick={handleSimulateMessage}
                      disabled={!userInput.trim() || isSimulating}
                      className="btn btn-primary"
                    >
                      <WhatsappIcon className="w-4 h-4" />
                    </button>
                  </div>
                </aside>
              </div>

              {/* Node Properties Modal */}
              {editingNodeId && (() => {
                const node = currentFlow.nodes.find(n => n.id === editingNodeId)
                if (!node) return null
                
                return (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getNodeIconBg(node.type)}`}>
                            {getNodeTypeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-white">Propriedades do Nó</h3>
                            <p className="text-sm text-slate-400">{getNodeTypeTitle(node.type)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingNodeId(null)}
                          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Basic Properties */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-white mb-4">Configurações Básicas</h4>
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Título do Nó
                              </label>
                              <input
                                type="text"
                                value={node.title}
                                onChange={(e) => updateNode(node.id, { title: e.target.value })}
                                className="input w-full"
                                placeholder="Título do nó"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tipo do Nó
                              </label>
                              <select 
                                value={node.type}
                                onChange={(e) => updateNode(node.id, { 
                                  type: e.target.value as FlowNode['type'],
                                  title: getNodeTypeTitle(e.target.value as FlowNode['type']),
                                  ...(e.target.value.startsWith('menu') && !node.options && { 
                                    options: [{ text: 'Opção 1', nextNodeId: '' }] 
                                  })
                                })}
                                className="input w-full"
                              >
                                <optgroup label="Básicos">
                                  <option value="welcome">Boas-vindas</option>
                                  <option value="message">Mensagem</option>
                                </optgroup>
                                <optgroup label="Menus">
                                  <option value="menu">Menu Básico</option>
                                  <option value="menu_produtos">Menu Produtos</option>
                                  <option value="menu_suporte">Menu Suporte</option>
                                  <option value="menu_horarios">Menu Horários</option>
                                </optgroup>
                                <optgroup label="Condições">
                                  <option value="condition">Condição Básica</option>
                                  <option value="condition_horario">Condição Horário</option>
                                  <option value="condition_usuario">Condição Usuário</option>
                                  <option value="condition_tag">Condição Tag</option>
                                </optgroup>
                                <optgroup label="Ações">
                                  <option value="action">Ação Básica</option>
                                  <option value="action_transferir">Transferir Atendimento</option>
                                  <option value="action_tag">Adicionar Tag</option>
                                  <option value="action_webhook">Webhook</option>
                                  <option value="action_delay">Delay</option>
                                  <option value="action_salvar_dados">Salvar Dados</option>
                                </optgroup>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Conteúdo/Mensagem
                              </label>
                              <textarea
                                value={node.content}
                                onChange={(e) => updateNode(node.id, { content: e.target.value })}
                                rows={4}
                                className="input w-full"
                                placeholder="Conteúdo da mensagem..."
                              />
                            </div>

                            {/* Tags */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Tags (separadas por vírgula)
                              </label>
                              <input
                                type="text"
                                value={node.tags?.join(', ') || ''}
                                onChange={(e) => updateNode(node.id, { 
                                  tags: e.target.value ? e.target.value.split(',').map(t => t.trim()) : [] 
                                })}
                                className="input w-full"
                                placeholder="exemplo: produto, vendas, importante"
                              />
                            </div>

                            {/* Execute When */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Executar Quando
                              </label>
                              <select
                                value={node.executeWhen || ''}
                                onChange={(e) => updateNode(node.id, { executeWhen: e.target.value || undefined })}
                                className="input w-full"
                              >
                                <option value="">Sempre</option>
                                <option value="horario_comercial">Horário Comercial</option>
                                <option value="fora_horario">Fora do Horário</option>
                                <option value="primeiro_contato">Primeiro Contato</option>
                                <option value="cliente_vip">Cliente VIP</option>
                              </select>
                            </div>
                          </div>

                          {/* Advanced Properties */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-white mb-4">Configurações Avançadas</h4>

                            {/* Menu Options */}
                            {node.type.includes('menu') && (
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                  Opções de Menu
                                </label>
                                <div className="space-y-3">
                                  {(node.options || []).map((option, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => {
                                          const newOptions = [...(node.options || [])]
                                          newOptions[idx] = { ...option, text: e.target.value }
                                          updateNode(node.id, { options: newOptions })
                                        }}
                                        className="input flex-1"
                                        placeholder="Texto da opção"
                                      />
                                      <button 
                                        onClick={() => {
                                          const newOptions = (node.options || []).filter((_, i) => i !== idx)
                                          updateNode(node.id, { options: newOptions })
                                        }}
                                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => {
                                      const newOptions = [...(node.options || []), { text: 'Nova opção', nextNodeId: '' }]
                                      updateNode(node.id, { options: newOptions })
                                    }}
                                    className="w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg border border-purple-500/30 transition-colors"
                                  >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Adicionar Opção
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Conditions */}
                            {node.type.includes('condition') && (
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                  Condições
                                </label>
                                <div className="space-y-3">
                                  {(node.conditions || []).map((condition, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2">
                                      <input
                                        type="text"
                                        value={condition.field}
                                        onChange={(e) => {
                                          const newConditions = [...(node.conditions || [])]
                                          newConditions[idx] = { ...condition, field: e.target.value }
                                          updateNode(node.id, { conditions: newConditions })
                                        }}
                                        className="input"
                                        placeholder="Campo"
                                      />
                                      <select
                                        value={condition.operator}
                                        onChange={(e) => {
                                          const newConditions = [...(node.conditions || [])]
                                          newConditions[idx] = { ...condition, operator: e.target.value }
                                          updateNode(node.id, { conditions: newConditions })
                                        }}
                                        className="input"
                                      >
                                        <option value="igual">Igual</option>
                                        <option value="diferente">Diferente</option>
                                        <option value="contem">Contém</option>
                                        <option value="nao_contem">Não contém</option>
                                        <option value="maior">Maior</option>
                                        <option value="menor">Menor</option>
                                        <option value="entre">Entre</option>
                                      </select>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={condition.value}
                                          onChange={(e) => {
                                            const newConditions = [...(node.conditions || [])]
                                            newConditions[idx] = { ...condition, value: e.target.value }
                                            updateNode(node.id, { conditions: newConditions })
                                          }}
                                          className="input flex-1"
                                          placeholder="Valor"
                                        />
                                        <button 
                                          onClick={() => {
                                            const newConditions = (node.conditions || []).filter((_, i) => i !== idx)
                                            updateNode(node.id, { conditions: newConditions })
                                          }}
                                          className="px-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => {
                                      const newConditions = [...(node.conditions || []), { field: 'campo', operator: 'igual', value: '', nextNodeId: '' }]
                                      updateNode(node.id, { conditions: newConditions })
                                    }}
                                    className="w-full px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg border border-yellow-500/30 transition-colors"
                                  >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Adicionar Condição
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {node.type.includes('action') && (
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">
                                  Ações
                                </label>
                                <div className="space-y-3">
                                  {(node.actions || []).map((action, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-2">
                                      <select
                                        value={action.type}
                                        onChange={(e) => {
                                          const newActions = [...(node.actions || [])]
                                          newActions[idx] = { ...action, type: e.target.value }
                                          updateNode(node.id, { actions: newActions })
                                        }}
                                        className="input"
                                      >
                                        <option value="transferir_atendente">Transferir Atendente</option>
                                        <option value="adicionar_tag">Adicionar Tag</option>
                                        <option value="webhook">Webhook</option>
                                        <option value="delay">Delay</option>
                                        <option value="salvar_campo">Salvar Campo</option>
                                        <option value="enviar_email">Enviar Email</option>
                                      </select>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={action.value}
                                          onChange={(e) => {
                                            const newActions = [...(node.actions || [])]
                                            newActions[idx] = { ...action, value: e.target.value }
                                            updateNode(node.id, { actions: newActions })
                                          }}
                                          className="input flex-1"
                                          placeholder="Valor da ação"
                                        />
                                        <button 
                                          onClick={() => {
                                            const newActions = (node.actions || []).filter((_, i) => i !== idx)
                                            updateNode(node.id, { actions: newActions })
                                          }}
                                          className="px-2 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => {
                                      const newActions = [...(node.actions || []), { type: 'transferir_atendente', value: '', data: {} }]
                                      updateNode(node.id, { actions: newActions })
                                    }}
                                    className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                                  >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Adicionar Ação
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                        <button
                          onClick={() => setEditingNodeId(null)}
                          className="btn btn-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            setEditingNodeId(null)
                            if (toast) {
                              toast('Propriedades do nó salvas!', 'success')
                            }
                          }}
                          className="btn btn-primary"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {/* Flows List */}
          {flows.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Meus Fluxos</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flows.map(flow => (
                  <div key={flow.id} className="border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{flow.name}</h4>
                      <Badge variant={flow.active ? "success" : "warning"}>
                        {flow.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {flow.description && (
                      <p className="text-sm text-slate-400 mb-3">{flow.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{flow.nodes?.length || 0} nós</span>
                      <span>{new Date(flow.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => {
                          setCurrentFlow(flow)
                          initializeChat(flow)
                        }}
                        className="btn btn-outline btn-sm flex-1"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => deleteFlow(flow.id)}
                        className="btn btn-destructive btn-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Flow Modal */}
          {isCreatingFlow && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-lg p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">Criar Novo Fluxo</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nome do Fluxo
                    </label>
                    <input
                      type="text"
                      value={newFlowName}
                      onChange={(e) => setNewFlowName(e.target.value)}
                      className="input w-full"
                      placeholder="Ex: Atendimento Inicial"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={newFlowDescription}
                      onChange={(e) => setNewFlowDescription(e.target.value)}
                      className="input w-full"
                      rows={3}
                      placeholder="Descreva o objetivo deste fluxo..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setIsCreatingFlow(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={createNewFlow}
                    disabled={!newFlowName.trim()}
                    className="btn btn-primary flex-1"
                  >
                    Criar Fluxo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Shell>
    </ProtectedRoute>
  )
}
