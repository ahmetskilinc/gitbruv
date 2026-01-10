import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signUpWithUsername } from "@/lib/auth-client";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithUsername({ name, username, email, password });
      if (result.error) {
        Alert.alert("Error", result.error.message || "Registration failed");
      } else {
        router.replace("/(tabs)");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-12">
            <View className="mb-8 items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
                <FontAwesome name="code-fork" size={32} color="white" />
              </View>
              <Text className="text-2xl font-bold text-white">Create an account</Text>
              <Text className="mt-2 text-gray-400">Join GitBruv and start coding</Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="mb-2 text-sm font-medium text-gray-300">Name</Text>
                <TextInput
                  className="rounded-xl bg-gray-800 px-4 py-3.5 text-white"
                  placeholder="John Doe"
                  placeholderTextColor="#6b7280"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-sm font-medium text-gray-300">Username</Text>
                <TextInput
                  className="rounded-xl bg-gray-800 px-4 py-3.5 text-white"
                  placeholder="johndoe"
                  placeholderTextColor="#6b7280"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-sm font-medium text-gray-300">Email</Text>
                <TextInput
                  className="rounded-xl bg-gray-800 px-4 py-3.5 text-white"
                  placeholder="you@example.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-sm font-medium text-gray-300">Password</Text>
                <View className="relative">
                  <TextInput
                    className="rounded-xl bg-gray-800 px-4 py-3.5 pr-12 text-white"
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5">
                    <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#6b7280" />
                  </Pressable>
                </View>
                <Text className="mt-1 text-xs text-gray-500">Must be at least 8 characters</Text>
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                className={`mt-6 rounded-xl py-4 ${loading ? "bg-blue-800" : "bg-blue-600 active:bg-blue-700"}`}
              >
                <Text className="text-center font-semibold text-white">{loading ? "Creating account..." : "Create Account"}</Text>
              </Pressable>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-gray-400">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="font-medium text-blue-500">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
