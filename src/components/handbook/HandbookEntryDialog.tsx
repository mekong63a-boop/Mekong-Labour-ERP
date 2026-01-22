import { useState, useRef, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { HandbookEntry, uploadHandbookFile, deleteHandbookFile } from '@/hooks/useHandbook';

interface HandbookEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: HandbookEntry | null;
  onSave: (data: Partial<HandbookEntry>) => Promise<void>;
}

export function HandbookEntryDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: HandbookEntryDialogProps) {
  const [form, setForm] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    category: entry?.category || '',
    tags: entry?.tags || [],
    image_urls: entry?.image_urls || [],
    document_urls: entry?.document_urls || [],
    cost_info: entry?.cost_info || '',
    support_policy: entry?.support_policy || '',
    order_index: entry?.order_index || 0,
    is_published: entry?.is_published ?? true,
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadHandbookFile(file, 'images');
        urls.push(url);
      }
      setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }));
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadHandbookFile(file, 'documents');
        urls.push(url);
      }
      setForm(prev => ({ ...prev, document_urls: [...prev.document_urls, ...urls] }));
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      await deleteHandbookFile(url);
      setForm(prev => ({ ...prev, image_urls: prev.image_urls.filter(u => u !== url) }));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleRemoveDoc = async (url: string) => {
    try {
      await deleteHandbookFile(url);
      setForm(prev => ({ ...prev, document_urls: prev.document_urls.filter(u => u !== url) }));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        tags: form.tags.length > 0 ? form.tags : null,
        image_urls: form.image_urls.length > 0 ? form.image_urls : null,
        document_urls: form.document_urls.length > 0 ? form.document_urls : null,
        content: form.content || null,
        category: form.category || null,
        cost_info: form.cost_info || null,
        support_policy: form.support_policy || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace(/^\d+_\w+\./, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? 'Chỉnh sửa mục cẩm nang' : 'Thêm mục cẩm nang mới'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="VD: Quy trình tuyển dụng, Chi phí, Chính sách..."
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Nhập nội dung chi tiết..."
              rows={6}
            />
          </div>

          {/* Cost Info */}
          <div>
            <Label htmlFor="cost_info">Thông tin chi phí</Label>
            <Textarea
              id="cost_info"
              value={form.cost_info}
              onChange={(e) => setForm(prev => ({ ...prev, cost_info: e.target.value }))}
              placeholder="Nhập thông tin chi phí..."
              rows={3}
            />
          </div>

          {/* Support Policy */}
          <div>
            <Label htmlFor="support_policy">Chính sách hỗ trợ</Label>
            <Textarea
              id="support_policy"
              value={form.support_policy}
              onChange={(e) => setForm(prev => ({ ...prev, support_policy: e.target.value }))}
              placeholder="Nhập chính sách hỗ trợ..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Nhập tag và Enter..."
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Thêm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <Label>Hình ảnh</Label>
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="w-full mb-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              Tải lên hình ảnh
            </Button>
            <div className="grid grid-cols-3 gap-2">
              {form.image_urls.map((url) => (
                <div key={url} className="relative group">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div>
            <Label>Tài liệu</Label>
            <input
              type="file"
              ref={docInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              multiple
              onChange={handleDocUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => docInputRef.current?.click()}
              disabled={uploading}
              className="w-full mb-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Tải lên tài liệu
            </Button>
            <div className="space-y-2">
              {form.document_urls.map((url) => (
                <div key={url} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm text-primary hover:underline">
                    {getFileName(url)}
                  </a>
                  <button type="button" onClick={() => handleRemoveDoc(url)} className="text-red-500 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order & Published */}
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <Label htmlFor="order_index">Thứ tự hiển thị</Label>
              <Input
                id="order_index"
                type="number"
                value={form.order_index}
                onChange={(e) => setForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_published"
                checked={form.is_published}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Công khai</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-primary">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {entry ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
