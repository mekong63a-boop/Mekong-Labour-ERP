import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserSearch } from "lucide-react";

interface TraineeSearchBoxProps {
  onSearch: (code: string) => void;
  isLoading: boolean;
}

export function TraineeSearchBox({ onSearch, isLoading }: TraineeSearchBoxProps) {
  const [searchCode, setSearchCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchCode);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Nhập mã học viên (VD: 009080)"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !searchCode.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Đang tìm...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-1" />
            Tra cứu
          </>
        )}
      </Button>
    </form>
  );
}
