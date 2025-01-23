import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import {
  ChatLocutorService,
  ChatLocutorGeneration,
} from '../services/chat-locutor.service';

@Controller('chat-locutor/tts')
export class ChatLocutorController {
  constructor(private readonly chatLocutorService: ChatLocutorService) {}

  @Post('generate')
  async generateSpeech(
    @Body() body: { text: string; title: string },
  ): Promise<ChatLocutorGeneration> {
    return this.chatLocutorService.generateSpeech(body.text, body.title);
  }

  @Get('generations')
  async getGenerations(): Promise<ChatLocutorGeneration[]> {
    return this.chatLocutorService.getGenerations();
  }

  @Delete('generation/:id')
  async deleteGeneration(@Param('id') id: string): Promise<void> {
    await this.chatLocutorService.deleteGeneration(id);
  }
}
