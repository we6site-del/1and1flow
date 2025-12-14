
INSERT INTO curated_prompts (title, prompt, negative_prompt, image_url, category, tags, is_active)
VALUES 
(
    'Cyberpunk City', 
    'A futuristic city with neon lights, raining, cyberpunk style, high detail, 8k', 
    'blurry, low quality', 
    'https://images.unsplash.com/photo-1531297461136-82lw9z0u8j0?auto=format&fit=crop&w=1000&q=80', 
    'Sci-Fi', 
    ARRAY['cyberpunk', 'city', 'neon'],
    true
),
(
    'Abstract Fluid', 
    'Colorful fluid simulation, abstract art, vibrant colors, flowing shapes, 4k wallpaper', 
    'text, watermarks', 
    'https://images.unsplash.com/photo-1541701494587-b585cc449868?auto=format&fit=crop&w=1000&q=80', 
    'Abstract', 
    ARRAY['abstract', 'fluid', 'colorful'],
    true
);
