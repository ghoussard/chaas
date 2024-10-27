import {
  Drawer,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import {useFocusableElementRef} from '../hooks';

export type AccountDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  name: string;
};

export const AccountDrawer = ({isOpen, onClose, name}: AccountDrawerProps) => {
  const focusableElementRef = useFocusableElementRef();

  return (
    <Drawer
      isOpen={isOpen}
      placement={'right'}
      onClose={onClose}
      size={'xl'}
      finalFocusRef={focusableElementRef}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{name}</DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default AccountDrawer;
