import type { DirectionSchema } from '@codequest/domain';

export type AvatarPresentation = 'boy' | 'girl';

export type AvatarMovementState =
  | 'idle'
  | 'walking'
  | 'turning-left'
  | 'turning-right'
  | 'collecting'
  | 'interacting'
  | 'rejected'
  | 'fault';

export interface AvatarRigTheme {
  readonly shirtColor: string;
  readonly pantsColor: string;
  readonly hairColor: string;
  readonly skinColor: string;
  readonly hairStyle: 'short' | 'long';
}

const boyTheme: AvatarRigTheme = {
  shirtColor: '#4a90e2',
  pantsColor: '#25314d',
  hairColor: '#3b2a1a',
  skinColor: '#d9a075',
  hairStyle: 'short',
};

const girlTheme: AvatarRigTheme = {
  shirtColor: '#e26aa6',
  pantsColor: '#3a2750',
  hairColor: '#5a3a1a',
  skinColor: '#e8b894',
  hairStyle: 'long',
};

export const avatarTheme = (presentation: AvatarPresentation): AvatarRigTheme =>
  presentation === 'boy' ? boyTheme : girlTheme;

export const facingToRadians = (facing: DirectionSchema): number => {
  switch (facing) {
    case 'north':
      return 0;
    case 'east':
      return Math.PI / 2;
    case 'south':
      return Math.PI;
    case 'west':
      return -Math.PI / 2;
  }
};