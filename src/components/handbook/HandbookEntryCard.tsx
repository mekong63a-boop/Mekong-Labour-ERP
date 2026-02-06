import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Pencil, Trash2, FileText, DollarSign, Heart, ExternalLink } from 'lucide-react';
import { HandbookEntry } from '@/hooks/useHandbook';
import { formatVietnameseDatetime } from '@/lib/vietnamese-utils';

interface HandbookEntryCardProps {
  entry: HandbookEntry;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function HandbookEntryCard({
  entry,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: HandbookEntryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    // Remove timestamp prefix if exists
    return name.replace(/^\d+_\w+\./, '').substring(0, 30) + (name.length > 30 ? '...' : '');
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {entry.category && (
                  <Badge variant="outline" className="text-xs">
                    {entry.category}
                  </Badge>
                )}
                {!entry.is_published && (
                  <Badge variant="secondary" className="text-xs">
                    Nháp
                  </Badge>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <button className="text-left w-full">
                  <CardTitle className="text-lg hover:text-primary transition-colors flex items-center gap-2">
                    {entry.title}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </button>
              </CollapsibleTrigger>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {(canEdit || canDelete) && (
              <div className="flex gap-1">
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={onEdit}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Content */}
            {entry.content && (
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">{entry.content}</p>
              </div>
            )}

            {/* Cost Info */}
            {entry.cost_info && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-blue-800 mb-1">
                  <DollarSign className="h-4 w-4" />
                  Chi phí
                </div>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{entry.cost_info}</p>
              </div>
            )}

            {/* Support Policy */}
            {entry.support_policy && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-green-800 mb-1">
                  <Heart className="h-4 w-4" />
                  Chính sách hỗ trợ
                </div>
                <p className="text-sm text-green-700 whitespace-pre-wrap">{entry.support_policy}</p>
              </div>
            )}

            {/* Images */}
            {entry.image_urls && entry.image_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Hình ảnh đính kèm</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {entry.image_urls.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Hình ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {entry.document_urls && entry.document_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Tài liệu đính kèm</p>
                <div className="space-y-1">
                  {entry.document_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 border rounded hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{getFileName(url)}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Cập nhật: {formatVietnameseDatetime(entry.updated_at)}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
