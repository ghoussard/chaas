import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  Kbd,
  ListItem,
  VStack,
  Box,
  Heading,
  ModalFooter,
} from '@chakra-ui/react';
import {useFocusableElementRef, useOnKeyboardShortcuts} from '../hooks';

type ShortcutLineProps = {
  keyLetter: string;
  description: string;
};

const ShortcutItem = ({keyLetter, description}: ShortcutLineProps) => {
  return (
    <ListItem gap={10} display={'flex'} alignItems={'center'}>
      <Box>
        <Kbd>crtl</Kbd> + <Kbd>{keyLetter}</Kbd>
      </Box>
      <Box>{description}</Box>
    </ListItem>
  );
};

export const HelpModal = () => {
  const {isOpen, onToggle, onClose} = useDisclosure();
  const focusableElementRef = useFocusableElementRef();

  useOnKeyboardShortcuts({
    h: onToggle,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      finalFocusRef={focusableElementRef}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Help</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={5}>
            <Heading size={'md'}>Shortcuts</Heading>
            <List spacing={5}>
              <ShortcutItem keyLetter="f" description="Focus on search input" />
              <ShortcutItem keyLetter="u" description="Clear search input" />
              <ShortcutItem keyLetter="h" description="Show help" />
            </List>
          </VStack>
        </ModalBody>
        <ModalFooter />
      </ModalContent>
    </Modal>
  );
};
