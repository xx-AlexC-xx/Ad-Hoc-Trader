import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface SymbolInputProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

const SymbolInput: React.FC<SymbolInputProps> = ({ value, onChange, className = '' }) => {
  const [inputValue, setInputValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onChange(inputValue.trim().toUpperCase());
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={() => {
            setInputValue(value);
            setIsEditing(false);
          }}
          placeholder="Enter symbol (e.g., AAPL)"
          className="w-32 bg-gray-800 border-gray-600 text-white text-sm"
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 cursor-pointer ${className}`}
      onClick={() => {
        setInputValue(value);
        setIsEditing(true);
      }}
    >
      <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm hover:bg-gray-700 transition-colors">
        {value}
      </div>
      <Search className="h-4 w-4 text-gray-400" />
    </div>
  );
};

export default SymbolInput;