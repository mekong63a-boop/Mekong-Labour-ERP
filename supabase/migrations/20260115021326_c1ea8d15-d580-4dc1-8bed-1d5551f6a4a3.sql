-- Create table for internal union members
CREATE TABLE public.union_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  hometown VARCHAR(255),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'Đang tham gia',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for union transactions
CREATE TABLE public.union_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Thu', 'Chi')),
  amount DECIMAL(15, 0) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id UUID REFERENCES public.union_members(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.union_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.union_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for union_members
CREATE POLICY "Authenticated users can view union members"
  ON public.union_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert union members"
  ON public.union_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update union members"
  ON public.union_members FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete union members"
  ON public.union_members FOR DELETE
  TO authenticated
  USING (true);

-- RLS policies for union_transactions
CREATE POLICY "Authenticated users can view union transactions"
  ON public.union_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert union transactions"
  ON public.union_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update union transactions"
  ON public.union_transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete union transactions"
  ON public.union_transactions FOR DELETE
  TO authenticated
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_union_members_updated_at
  BEFORE UPDATE ON public.union_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_union_transactions_updated_at
  BEFORE UPDATE ON public.union_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();