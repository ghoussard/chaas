import {ReactNode} from 'react';
import {render} from '@testing-library/react';
import {ChakraProvider} from '@chakra-ui/react';

export const renderWithChakra = (children: ReactNode) =>
  render(<ChakraProvider>{children}</ChakraProvider>);
