const Chat = require('../models/Chat');
const aiService = require('../services/aiService');

const chatController = {
  async sendMessage(req, res) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      // Obtener chat completo del usuario
      let chat = await Chat.findOne({ userId }).sort({ 'messages.timestamp': -1 });
      if (!chat) {
        chat = new Chat({ userId, messages: [] });
      }

      // Obtener respuesta de la IA con todo el historial
      const aiResponse = await aiService.getAIResponse(message, chat.messages);

      // Guardar nueva interacción
      chat.messages.push(
        { sender: 'user', content: message, timestamp: new Date() },
        { sender: 'ai', content: aiResponse, timestamp: new Date() }
      );

      await chat.save();

      res.json({
        success: true,
        message: aiResponse
      });
    } catch (error) {
      console.error('Error en chat:', error);
      res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
  },

  extractTopics(message) {
    const topics = new Set();
    const keywords = ['enfermedad', 'síntoma', 'tratamiento', 'vacuna', 'alimentación', 'comportamiento'];
    
    keywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        topics.add(keyword);
      }
    });

    return Array.from(topics);
  },

  async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const chat = await Chat.findOne({ userId });
      res.json(chat ? chat.messages : []);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el historial' });
    }
  }
};

module.exports = chatController;
