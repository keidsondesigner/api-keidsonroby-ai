import { Body, Controller, Post, Logger } from '@nestjs/common';
import { ChatAutocarService } from '../services/chat-autocar.service';

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  response: string;
}

@Controller('chat-autocar')
export class ChatAutocarController {
  private readonly logger = new Logger(ChatAutocarController.name);

  constructor(private readonly chatService: ChatAutocarService) {}

  @Post('message')
  async processMessage(@Body() request: ChatRequest): Promise<ChatResponse> {
    this.logger.debug('Recebendo mensagem de chat');
    const response = await this.chatService.processMessage(request.message);
    return { response };
  }
}
