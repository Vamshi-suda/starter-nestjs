import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Request,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {ApiBearerAuth, ApiResponse, ApiTags} from '@nestjs/swagger';
import {UserService, IGenericMessageBody} from './user.service';
import {IUser} from './models/IUser';
import {Public} from 'src/common/decorators/public.decorator';
import {AuthGuard} from 'src/common/guards/auth.guard';
import {LocaleUpdate} from './payload/user.payload';
import {Restricted} from '@/common/decorators/restricted.decorator';
import {FastifyRequest} from 'fastify';

export type updatePasswordPayload = {
  password: string;
  glid: string;
};

/**
 * User Controller
 */
@ApiBearerAuth()
@ApiTags('user')
@Controller('user')
export class UserController {
  /**
   * Constructor
   * @param userService
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves a particular user
   * @param username the user given username to fetch
   * @returns {Promise<IUser>} queried user data
   */
  @Get(':guid')
  @UseGuards(AuthGuard)
  @ApiResponse({status: 200, description: 'Fetch User Request Received'})
  @ApiResponse({status: 400, description: 'Fetch User Request Failed'})
  async getUser(@Param('guid') guid: string): Promise<IUser> {
    const masterUser = await this.userService.getMasterUserByGuid(guid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    const user = await this.userService.getByGUID(guid, masterUser.location);
    if (!user) {
      throw new BadRequestException('The user with that username could not be found.');
    }
    return user;
  }

  /**
   * Edit a user
   * @param {RegisterPayload} payload
   * @returns {Promise<IUser>} mutated user data
   */
  @Patch()
  @UseGuards(AuthGuard)
  @ApiResponse({status: 200, description: 'Patch User Request Received'})
  @ApiResponse({status: 400, description: 'Patch User Request Failed'})
  async patchUser(@Body() payload) {
    //return await this.userService.edit(payload);
  }

  @Public()
  @Get('glid/:glid')
  @ApiResponse({status: 200, description: 'check GLID Request Received'})
  @ApiResponse({status: 400, description: 'check GLID Request Failed'})
  async getUserByGLID(@Param('glid') glid: string): Promise<IUser> {
    const masterUser = await this.userService.getMasterUserByGLID(glid);
    if (!masterUser) {
      throw new BadRequestException('Invalid GLID');
    }
    return await this.userService.getUserByQuery({glid: glid, location: masterUser.location});
  }

  @Delete(':username')
  @UseGuards(AuthGuard)
  @ApiResponse({status: 200, description: 'Delete User Request Received'})
  @ApiResponse({status: 400, description: 'Delete User Request Failed'})
  async delete(@Param('username') username: string): Promise<IGenericMessageBody> {
    return await this.userService.delete(username);
  }

  @Put('update-password/:password')
  // @UseGuards(AuthGuard('jwt'))
  @ApiResponse({status: 200, description: 'check GLID Request Received'})
  @ApiResponse({status: 400, description: 'check GLID Request Failed'})
  @Restricted()
  async updateUserPassword(@Param('password') password: string, @Req() req: FastifyRequest) {
    const {id: guid} = req['user'];
    return await this.userService.updateUserPassword(guid, password);
  }

  @Patch('update-locale/:id/:location')
  async updateLocale(
    @Request() req,
    @Param('id') id: string,
    @Param('location') locationCode: string,
    @Body() updatedLocale: LocaleUpdate,
  ) {
    const userDetails = req['user'];
    const updateQuery =
      updatedLocale.updatedParam === 'location'
        ? {location: updatedLocale.updatedValue}
        : {
            [`preference.${updatedLocale.updatedParam}`]: updatedLocale.updatedValue,
          };

    const updatedUser = await this.userService.updateUser(
      {guid: id || userDetails.id, location: locationCode || userDetails.location},
      updateQuery,
      {
        projection: {
          password: 0,
        },
      },
    );
    if (updatedLocale.updatedParam === 'location') {
      await this.userService.updateUserMaster({guid: id || userDetails.id}, {location: updatedUser.location});
    }
    return updatedUser;
  }

  @Get('details')
  @ApiResponse({status: HttpStatus.ACCEPTED, description: 'Get User Details'})
  @ApiResponse({status: HttpStatus.UNAUTHORIZED, description: 'UnAuthorized'})
  @Restricted()
  async getUserDetails(@Req() req: FastifyRequest) {
    const userContext = req['user'];
    const guid = userContext.id;
    return await this.userService.getUserDetails(guid);
  }
}
