jest.mock('react-native-toast-message', () => ({
  ...jest.requireActual('react-native-toast-message'),
  show: jest.fn()
}));
