import { prisma } from '../lib/db'
import { Request, Response } from 'express'

// Tipos para os nós do fluxo
interface FlowNode {
  id: string
  type: 'welcome' | 'message' | 'menu' | 'condition' | 'action'
  title: string
  content: string
  position: { x: number; y: number }
  connections: string[]
  options?: { text: string; nextNodeId: string }[]
  conditions?: { field: string; operator: string; value: string; nextNodeId: string }[]
}

interface ChatbotFlowData {
  name: string
  description?: string
  nodes: FlowNode[]
  active?: boolean
}

export async function getChatbotFlows(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const flows = await prisma.chatbotFlow.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ flows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar fluxos', error: String(err) })
  }
}

export async function createChatbotFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { name, description, nodes } = req.body as ChatbotFlowData
    if (!name || !nodes) return res.status(400).json({ success: false, message: 'Nome e nodes obrigatórios' })
    
    const flow = await prisma.chatbotFlow.create({
      data: {
        userId: req.user!.id,
        name,
        description,
        nodes: nodes as any, // Força o tipo para JSON
        active: true
      }
    })
    res.json({ success: true, flow })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao criar fluxo', error: String(err) })
  }
}

export async function updateChatbotFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    const { name, description, nodes, active } = req.body as ChatbotFlowData
    
    const flow = await prisma.chatbotFlow.findFirst({
      where: { id: parseInt(id), userId: req.user?.id }
    })
    
    if (!flow) {
      return res.status(404).json({ success: false, message: 'Fluxo não encontrado' })
    }
    
    const updatedFlow = await prisma.chatbotFlow.update({
      where: { id: parseInt(id) },
      data: { name, description, nodes: nodes as any, active } // Força o tipo para JSON
    })
    
    res.json({ success: true, flow: updatedFlow })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar fluxo', error: String(err) })
  }
}

export async function deleteChatbotFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    
    const flow = await prisma.chatbotFlow.findFirst({
      where: { id: parseInt(id), userId: req.user?.id }
    })
    
    if (!flow) {
      return res.status(404).json({ success: false, message: 'Fluxo não encontrado' })
    }
    
    await prisma.chatbotFlow.delete({
      where: { id: parseInt(id) }
    })
    
    res.json({ success: true, message: 'Fluxo excluído com sucesso' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao excluir fluxo', error: String(err) })
  }
}

export async function getChatbotFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    
    const flow = await prisma.chatbotFlow.findFirst({
      where: { id: parseInt(id), userId: req.user?.id }
    })
    
    if (!flow) {
      return res.status(404).json({ success: false, message: 'Fluxo não encontrado' })
    }
    
    res.json({ success: true, flow })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar fluxo', error: String(err) })
  }
}

export async function duplicateChatbotFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    
    const originalFlow = await prisma.chatbotFlow.findFirst({
      where: { id: parseInt(id), userId: req.user?.id }
    })
    
    if (!originalFlow) {
      return res.status(404).json({ success: false, message: 'Fluxo não encontrado' })
    }
    
    const duplicatedFlow = await prisma.chatbotFlow.create({
      data: {
        userId: req.user!.id,
        name: `${originalFlow.name} (Cópia)`,
        description: originalFlow.description,
        nodes: originalFlow.nodes as any, // Força o tipo para JSON
        active: false
      }
    })
    
    res.json({ success: true, flow: duplicatedFlow })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao duplicar fluxo', error: String(err) })
  }
}

// Função para executar/simular um fluxo de chatbot
export async function simulateFlow(req: Request & { user?: { id: number } }, res: Response) {
  try {
    const { id } = req.params
    const { userMessage, currentNodeId } = req.body
    
    const flow = await prisma.chatbotFlow.findFirst({
      where: { id: parseInt(id), userId: req.user?.id, active: true }
    })
    
    if (!flow) {
      return res.status(404).json({ success: false, message: 'Fluxo não encontrado ou inativo' })
    }
    
    const nodes = (flow.nodes as unknown) as FlowNode[]
    let currentNode: FlowNode | undefined
    
    if (currentNodeId) {
      currentNode = nodes.find(node => node.id === currentNodeId)
    } else {
      // Busca o nó inicial (tipo welcome ou primeiro nó)
      currentNode = nodes.find(node => node.type === 'welcome') || nodes[0]
    }
    
    if (!currentNode) {
      return res.status(400).json({ success: false, message: 'Nó não encontrado' })
    }
    
    // Simula a resposta baseada no tipo do nó
    let botResponse = currentNode.content
    let nextNodeId = null
    let options: string[] = []
    
    if (currentNode.type === 'menu' && currentNode.options) {
      options = currentNode.options.map(opt => opt.text)
      // Se o usuário enviou uma mensagem, procura a opção correspondente
      if (userMessage) {
        const selectedOption = currentNode.options.find(opt => 
          opt.text.toLowerCase().includes(userMessage.toLowerCase()) ||
          userMessage.toLowerCase().includes(opt.text.toLowerCase())
        )
        if (selectedOption) {
          nextNodeId = selectedOption.nextNodeId
        }
      }
    } else if (currentNode.connections.length > 0) {
      // Para nós simples, segue a primeira conexão
      nextNodeId = currentNode.connections[0]
    }
    
    res.json({
      success: true,
      response: {
        message: botResponse,
        options,
        nextNodeId,
        nodeType: currentNode.type
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao simular fluxo', error: String(err) })
  }
}
