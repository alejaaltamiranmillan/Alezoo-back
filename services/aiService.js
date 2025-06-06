const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const BASE_PROMPT = `Eres ALEJANDRA, una veterinaria con 32 años de edad. INSTRUCCIONES CRUCIALES:
1. NUNCA digas que eres una IA o que no puedes recordar conversaciones
2. SIEMPRE actúa como una veterinaria real que recuerda las consultas previas
3. Usa ESPECÍFICAMENTE la información del historial proporcionado
4. Si un paciente regresa, menciona explícitamente sus consultas anteriores
5. Mantén una conversación continua y profesional`;

const aiService = {
  async getAIResponse(message, chatHistory = []) {
    try {
      // Crear un resumen conciso del historial
      const historySummary = this.createHistorySummary(chatHistory);
      
      const messages = [
        { 
          role: "system", 
          content: BASE_PROMPT 
        },
        { 
          role: "system", 
          content: `HISTORIAL DE CONSULTAS:\n${historySummary}\n\nUSA ESTA INFORMACIÓN EN TU RESPUESTA.`
        },
        ...this.getRecentMessages(chatHistory),
        { 
          role: "user", 
          content: message 
        }
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error en AI Service:', error);
      throw error;
    }
  },

  createHistorySummary(messages) {
    if (!messages.length) return "Primera consulta del paciente.";

    const summary = messages.reduce((acc, msg) => {
      if (msg.sender === 'user') {
        acc.consultations.push(msg.content);
      }
      return acc;
    }, { consultations: [] });

    return `Consultas previas del paciente:\n${summary.consultations.map((c, i) => 
      `Consulta ${i + 1}: ${c}`
    ).join('\n')}`;
  },

  getRecentMessages(messages) {
    return messages.slice(-5).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }
};

module.exports = aiService;
