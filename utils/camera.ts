import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type CameraResult = {
  uri: string;
  base64?: string;
  cancelled: boolean;
};

export async function requestCameraPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
}

export async function requestMediaLibraryPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting media library permissions:', error);
    return false;
  }
}

export async function takePhoto(): Promise<CameraResult> {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
      cameraType: ImagePicker.CameraType.back,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return {
        uri: '',
        cancelled: true,
      };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 || undefined,
      cancelled: false,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
}

export async function pickImage(): Promise<CameraResult> {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return {
        uri: '',
        cancelled: true,
      };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 || undefined,
      cancelled: false,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
}

export async function handleWebImageUpload(): Promise<CameraResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            uri: reader.result as string,
            cancelled: false,
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          uri: '',
          cancelled: true,
        });
      }
    };
    input.click();
  });
} 