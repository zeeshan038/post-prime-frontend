import { useMutation } from '@tanstack/react-query'
import { loginUser, registerUser, logoutUser, type RegisterPayload } from '../api/auth'

export function useSignup() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      loginUser(payload.email, payload.password),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: logoutUser,
  })
}