import axios from 'axios';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

// baseURL is something like https://evolutionapi.c2net.com.br
// The EVOLUTION_API_URL in .env.local is currently: 
// https://evolutionapi.c2net.com.br/message/sendText/cpu

const getBaseUrl = () => {
  if (!EVOLUTION_API_URL) return '';
  return EVOLUTION_API_URL.split('/message/')[0];
};

const INSTANCE = 'cpu';

export const whatsappService = {
  /**
   * Envia uma mensagem de texto simples
   */
  async sendText(number: string, text: string) {
    try {
      const url = `${getBaseUrl()}/message/sendText/${INSTANCE}`;
      const response = await axios.post(url, {
        number,
        text,
        delay: 1200,
        linkPreview: false
      }, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp text:', error);
      throw error;
    }
  },

  /**
   * Envia um arquivo PDF ou imagem
   */
  async sendMedia(number: string, mediaUrl: string, caption: string, fileName: string) {
    try {
      const url = `${getBaseUrl()}/message/sendMedia/${INSTANCE}`;
      const response = await axios.post(url, {
        number,
        media: mediaUrl,
        mediatype: 'document',
        caption: caption,
        fileName: fileName,
        delay: 2000
      }, {
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp media:', error);
      throw error;
    }
  }
};
