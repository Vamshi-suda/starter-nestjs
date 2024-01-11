// remove until typescript 5.1: https://github.com/microsoft/TypeScript/issues/49231#issuecomment-1137251612
declare namespace Intl {
  type Key = 'calendar' | 'collation' | 'currency' | 'numberingSystem' | 'timeZone' | 'unit';

  function supportedValuesOf(input: Key): string[];
}
