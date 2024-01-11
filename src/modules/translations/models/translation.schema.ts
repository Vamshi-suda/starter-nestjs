import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class TranslationSchema {
  @Prop({required: true, unique: true})
  language: string;
  @Prop()
  content: mongoose.Schema.Types.Mixed;
}
export interface ITranslations {
  language: string;
  content: object;
}

export const Translations = SchemaFactory.createForClass(TranslationSchema);
