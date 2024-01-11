import {SetMetadata} from '@nestjs/common';

export const IS_RESTRICTED_KEY = 'restricted';
export const Restricted = (...permissions: string[]) => SetMetadata(IS_RESTRICTED_KEY, permissions);
