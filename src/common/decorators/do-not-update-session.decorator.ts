import {SetMetadata} from '@nestjs/common';

export const DO_NOT_UPDATE_SESSION_KEY = Symbol('isPublic');
export const DoNotUpdateSession = () => SetMetadata(DO_NOT_UPDATE_SESSION_KEY, true);
