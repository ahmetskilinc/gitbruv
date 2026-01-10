import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { Link, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { signIn } from "@/lib/auth-client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        Alert.alert("Error", result.error.message || "Login failed");
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
              <Text className="text-2xl font-bold text-white">Welcome back</Text>
              <Text className="mt-2 text-gray-400">Sign in to your GitBruv account</Text>
            </View>

            <View className="space-y-4">
              <View>
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
                    autoComplete="password"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5">
                    <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#6b7280" />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                className={`mt-6 rounded-xl py-4 ${loading ? "bg-blue-800" : "bg-blue-600 active:bg-blue-700"}`}
              >
                <Text className="text-center font-semibold text-white">{loading ? "Signing in..." : "Sign In"}</Text>
              </Pressable>
            </View>

            <View className="mt-8 flex-row justify-center">
              <Text className="text-gray-400">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="font-medium text-blue-500">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
