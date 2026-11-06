import { create } from 'zustand';

interface Coordinates {
  lat: number;
  lng: number;
}

interface ToolsState {
  testQrValue: string;
  generatedQrValue: string;
  testQrError: string;
  testLocation: Coordinates | null;
  isTestLocationLoading: boolean;
  testLocationError: string | null;
  setTestQrValue: (value: string) => void;
  setGeneratedQrValue: (value: string) => void;
  setTestQrError: (value: string) => void;
  setTestLocation: (value: Coordinates | null) => void;
  setIsTestLocationLoading: (value: boolean) => void;
  setTestLocationError: (value: string | null) => void;
  resetTestQr: () => void;
  resetTestLocation: () => void;
}

export const useToolsStore = create<ToolsState>((set) => ({
  testQrValue: '',
  generatedQrValue: '',
  testQrError: '',
  testLocation: null,
  isTestLocationLoading: false,
  testLocationError: null,
  setTestQrValue: (testQrValue) => set({ testQrValue }),
  setGeneratedQrValue: (generatedQrValue) => set({ generatedQrValue }),
  setTestQrError: (testQrError) => set({ testQrError }),
  setTestLocation: (testLocation) => set({ testLocation }),
  setIsTestLocationLoading: (isTestLocationLoading) => set({ isTestLocationLoading }),
  setTestLocationError: (testLocationError) => set({ testLocationError }),
  resetTestQr: () => set({ testQrValue: '', generatedQrValue: '', testQrError: '' }),
  resetTestLocation: () => set({
    testLocation: null,
    isTestLocationLoading: false,
    testLocationError: null,
  }),
}));
