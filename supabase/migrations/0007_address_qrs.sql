-- QR image per deposit address. Stored as a base64 data URL
-- ("data:image/png;base64,..."). Sized for ~10 assets, small PNG/JPEG.

alter table public.deposit_addresses
  add column if not exists qr_image_data_url text;
