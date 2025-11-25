import {ReactNode} from 'react';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ChakraProvider} from '@chakra-ui/react';
import {Firestore} from 'firebase/firestore';
import {App} from './App';

// Mock child components
vi.mock('./pages', () => ({
  Login: () => <div>Login Page</div>,
  AccountGrid: () => <div>Account Grid Page</div>,
}));

// Mock hooks
vi.mock('./hooks', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({}) as Firestore),
}));

// Mock contexts
vi.mock('./contexts', () => ({
  createStoreContextValue: vi.fn(() => ({accountStore: {}})),
  StoreContext: {
    Provider: ({children}: {children: ReactNode}) => <div>{children}</div>,
  },
  ItemsProvider: ({children}: {children: ReactNode}) => <div>{children}</div>,
}));

const renderApp = () => {
  return render(
    <ChakraProvider>
      <App />
    </ChakraProvider>,
  );
};

describe('App initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Login page when user is not logged in', async () => {
    const {useAuth} = await import('./hooks');
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: false,
      isLoggingIn: false,
      logIn: vi.fn(),
      logOut: vi.fn(),
    });

    renderApp();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Account Grid Page')).not.toBeInTheDocument();
  });

  it('shows AccountGrid when user is logged in', async () => {
    const {useAuth} = await import('./hooks');
    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      isLoggingIn: false,
      logIn: vi.fn(),
      logOut: vi.fn(),
    });

    renderApp();

    expect(screen.getByText('Account Grid Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('initializes StoreContext and ItemsProvider when logged in', async () => {
    const {useAuth} = await import('./hooks');
    const {createStoreContextValue} = await import('./contexts');
    const {getFirestore} = await import('firebase/firestore');

    vi.mocked(useAuth).mockReturnValue({
      isLoggedIn: true,
      isLoggingIn: false,
      logIn: vi.fn(),
      logOut: vi.fn(),
    });

    renderApp();

    // Verify Firestore was retrieved
    expect(getFirestore).toHaveBeenCalled();

    // Verify StoreContext was created with firestore
    expect(createStoreContextValue).toHaveBeenCalledWith(expect.anything());
  });
});
