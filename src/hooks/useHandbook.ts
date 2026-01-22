import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HandbookEntry {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  image_urls: string[] | null;
  document_urls: string[] | null;
  cost_info: string | null;
  support_policy: string | null;
  order_index: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useHandbookEntries = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['handbook-entries', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('handbook_entries')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Client-side search filtering
      let entries = data as HandbookEntry[];
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        entries = entries.filter(entry => 
          entry.title.toLowerCase().includes(term) ||
          entry.content?.toLowerCase().includes(term) ||
          entry.category?.toLowerCase().includes(term) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(term)) ||
          entry.cost_info?.toLowerCase().includes(term) ||
          entry.support_policy?.toLowerCase().includes(term)
        );
      }
      
      return entries;
    },
  });
};

export const useAllHandbookEntries = () => {
  return useQuery({
    queryKey: ['handbook-entries-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('handbook_entries')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HandbookEntry[];
    },
  });
};

export const useCreateHandbookEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<HandbookEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('handbook_entries')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['handbook-entries-all'] });
      toast.success('Thêm mục cẩm nang thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useUpdateHandbookEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<HandbookEntry> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('handbook_entries')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['handbook-entries-all'] });
      toast.success('Cập nhật mục cẩm nang thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

export const useDeleteHandbookEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('handbook_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['handbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['handbook-entries-all'] });
      toast.success('Xóa mục cẩm nang thành công!');
    },
    onError: (error: Error) => {
      toast.error('Lỗi: ' + error.message);
    },
  });
};

// Upload file to handbook storage
export const uploadHandbookFile = async (file: File, folder: 'images' | 'documents'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('handbook-files')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('handbook-files')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Delete file from handbook storage
export const deleteHandbookFile = async (fileUrl: string): Promise<void> => {
  const path = fileUrl.split('/handbook-files/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('handbook-files')
    .remove([path]);

  if (error) throw error;
};
