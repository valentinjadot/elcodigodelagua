export type Bit = 1 | 0;

type BitSequence = {
  bit: 1 | 0;
  length: number;
};

type MorsePrimitive =
  | {
      bit: 1;
      length: 1;
      symbol: '.';
    }
  | {
      bit: 1;
      length: 3;
      symbol: '-';
    }
  | {
      bit: 0;
      length: 3;
      symbol: ' ';
    }
  | {
      bit: 0;
      length: 7;
      symbol: '   ';
    };

type MorseString = string;

const MORSE_ALPHANUMERIC_MAP = {
  '.-': 'a',
  '-...': 'b',
  '-.-.': 'c',
  '-..': 'd',
  '.': 'e',
  '..-.': 'f',
  '--.': 'g',
  '....': 'h',
  '..': 'i',
  '.---': 'j',
  '-.-': 'k',
  '.-..': 'l',
  '--': 'm',
  '-.': 'n',
  '---': 'o',
  '.--.': 'p',
  '--.-': 'q',
  '.-.': 'r',
  '...': 's',
  '-': 't',
  '..-': 'u',
  '...-': 'v',
  '.--': 'w',
  '-..-': 'x',
  '-.--': 'y',
  '--..': 'z',
  '.----': '1',
  '..---': '2',
  '...--': '3',
  '....-': '4',
  '.....': '5',
  '-....': '6',
  '--...': '7',
  '---..': '8',
  '----.': '9',
  '-----': '0',
} as const;

export const morsePrimitivesToMorseString = (
  morsePrimitives: MorsePrimitive[],
): MorseString => {
  return morsePrimitives
    .filter(Boolean)
    .map((primitive: MorsePrimitive) => primitive.symbol)
    .join('');
};

export function morseStringToHumanString(morseString: MorseString): string {
  return morseString
    .split('   ')
    .map((a) =>
      a
        .split(' ')
        .map(
          (b) =>
            MORSE_ALPHANUMERIC_MAP[b as keyof typeof MORSE_ALPHANUMERIC_MAP],
        )
        .join(''),
    )
    .join(' ');
}

export function decypherMorse(bits: Bit[]): string {
  const bitSequences = createBitSequences(bits);
  const morsePrimitives = mapSequencesToMorsePrimitives(bitSequences);
  const morseString = morsePrimitivesToMorseString(morsePrimitives);
  const humanString = morseStringToHumanString(morseString);
  console.log(humanString);
  return humanString;
}

function createBitSequences(bits: Bit[]): BitSequence[] {
  const initialValue: BitSequence[] = [];

  function accumulationFn(
    accumulator: BitSequence[],
    current: Bit,
  ): BitSequence[] {
    const lastSequence = accumulator[accumulator.length - 1];

    if (!lastSequence) {
      accumulator.push({
        bit: current,
        length: 1,
      });

      return accumulator;
    }

    if (lastSequence.bit === current) {
      lastSequence.length++;
    } else {
      accumulator.push({
        bit: current,
        length: 1,
      });
    }

    return accumulator;
  }

  const bitSequences = bits.reduce(accumulationFn, initialValue);
  return bitSequences;
}

function mapSequencesToMorsePrimitives(
  bitSequences: BitSequence[],
): MorsePrimitive[] {
  const morsePrimitives: (MorsePrimitive | undefined)[] = bitSequences.map(
    (bitSequence: BitSequence) => {
      if (bitSequence.bit === 1) {
        if (bitSequence.length === 1) {
          return {
            bit: 1,
            length: 1,
            symbol: '.',
          };
        } else if (bitSequence.length === 3) {
          return {
            bit: 1,
            length: 3,
            symbol: '-',
          };
        } else {
          return undefined;
        }
      } else if (bitSequence.bit === 0) {
        if (bitSequence.length === 3) {
          return {
            bit: 0,
            length: 3,
            symbol: ' ',
          };
        } else if (bitSequence.length === 7) {
          return {
            bit: 0,
            length: 7,
            symbol: '   ',
          };
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    },
  );

  return morsePrimitives.filter(Boolean) as MorsePrimitive[];
}
