import {Body, Controller, Get, Param, Post, Request} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {SessionService} from './session.service';
import {CloseSession, GetSessions} from './payload/Session.payload';
import {AuthRequest} from '../auth/dto/authRequest';
import {Restricted} from '@/common/decorators/restricted.decorator';

@Controller('session')
@ApiTags('session')
export class SessionController {
  constructor(private readonly sessionSer: SessionService) {}

  @Restricted()
  @Post('get')
  async getSessions(@Request() req: AuthRequest, @Body() body: GetSessions) {
    // return await this.sessionSer.getSessions('', body.query, body.page, body.pageSize, body.search);
    const user = req.user;
    return await this.sessionSer.getSessions(req.sessionId, user.id, body.query, body.page, body.pageSize, body.search);
  }

  @Get('get/:id')
  async getSession(@Param('id') id: string) {
    return await this.sessionSer.getSession(id);
  }

  @Post('close-session')
  async closeSession(@Body() body: CloseSession) {
    return await this.sessionSer.closeSession(body.sessionId);
  }
}
