"use client"

import { usePathname } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

export default function OnboardingProgress() {
  const pathname = usePathname()
  const currentStep = pathname.includes("step-1") ? 1 : pathname.includes("step-2") ? 2 : 3

  const steps = [
    { id: 1, name: "Personal Information" },
    { id: 2, name: "Work Preferences" },
    { id: 3, name: "Availability" },
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <div key={step.id} className={`flex items-center ${stepIdx === steps.length - 1 ? "" : "w-full"}`}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step.id < currentStep
                  ? "bg-red-600 text-white"
                  : step.id === currentStep
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.id < currentStep ? <CheckCircle2 className="w-6 h-6" /> : <span>{step.id}</span>}
            </div>
            <div className={`hidden sm:block ml-4 ${stepIdx === steps.length - 1 ? "" : "flex-1"}`}>
              <div className="text-sm font-medium">{step.name}</div>
            </div>
            {stepIdx < steps.length - 1 && (
              <div className="flex-1 hidden sm:block">
                <div className={`h-0.5 mx-4 ${step.id < currentStep ? "bg-red-600" : "bg-gray-200"}`}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

