interface PasswordStrengthIndicatorProps {
  strength: number;
}

export const PasswordStrengthIndicator = ({ strength }: PasswordStrengthIndicatorProps) => {
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            strength <= 25
              ? "bg-red-500"
              : strength <= 50
              ? "bg-orange-500"
              : strength <= 75
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Password strength: {strength}%
      </p>
    </div>
  );
};