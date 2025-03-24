document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('prompt-input');
    const sizeSelect = document.getElementById('size-select');
    const countSelect = document.getElementById('count-select');
    const generateBtn = document.getElementById('generate-btn');
    const loader = document.querySelector('.loading-container');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const themeToggle = document.getElementById('theme-toggle');
    const creativitySlider = document.getElementById('creativity-slider');
    const creativityValue = document.getElementById('creativity-value');
    

    const API_TOKEN = "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";
    
    // You can change the model based on your preference
    const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    
    
    
    if (creativitySlider && creativityValue) {
        creativitySlider.addEventListener('input', function() {
            creativityValue.textContent = this.value;
        });
    }
    
    generateBtn.addEventListener('click', generateImages);
    
    // Also generate when pressing Enter in the input field
    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            generateImages();
        }
    });
    
  // ... existing code ...

async function generateImages() {
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
        showNotification('Please enter a prompt', 'error');
        return;
    }
    
    // Get selected size and count
    const size = sizeSelect.value;
    const count = parseInt(countSelect.value);
    
    // Parse width and height from size
    const [width, height] = size.split('x').map(dim => parseInt(dim));
    
    // Get creativity value (guidance_scale is inverse to creativity)
    let guidanceScale = 7.5; // Default value
    if (creativitySlider) {
        const creativity = parseInt(creativitySlider.value);
        guidanceScale = 10 - (creativity / 10); // Map 0-100 to 10-0
    }
    
    // Show loading animation
    loader.style.display = 'flex';
    resultsSection.style.display = 'none';
    
    // Change button text and disable it
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    
    try {
        const generationPromises = [];
        
        // Create a promise for each image to be generated
        for (let i = 0; i < count; i++) {
            generationPromises.push(
                fetch(MODEL_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            width: width,
                            height: height,
                            guidance_scale: guidanceScale,
                            num_inference_steps: 30
                        },
                        options: {
                            wait_for_model: true
                        }
                    })
                })
            );
        }
        
        // Wait for all images to be generated
        const responses = await Promise.all(generationPromises);
        
        // Process each response
        for (const response of responses) {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Get the image as a blob
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Create and add image card to results
            const imageCard = createImageCard(imageUrl, prompt);
            resultsContainer.appendChild(imageCard);
        }
        resultsSection.style.display = 'block';
        showNotification('Images generated successfully!', 'info');
        
    } catch (error) {
        console.error('Error generating images:', error);
        showNotification('Error generating images. Please try again.', 'error');
    } finally {
        // Hide loading animation
        loader.style.display = 'none';
        
        // Reset button text and enable it
        generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate';
        generateBtn.disabled = false;
    }
}

    function createImageCard(imageUrl, promptText) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = promptText;
        img.loading = 'lazy';
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadBtn.onclick = () => downloadImage(imageUrl);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        
        actions.appendChild(downloadBtn);
        actions.appendChild(editBtn);
        card.appendChild(img);
        card.appendChild(actions);
        
        return card;
    }
    
    function downloadImage(imageUrl) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `ai-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Add animation to loading dots
    setInterval(() => {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            if (loadingText.textContent.endsWith('...')) {
                loadingText.textContent = 'Creating your masterpiece';
            } else {
                loadingText.textContent += '.';
            }
        }
    }, 500);
    

   
    const testimonials = document.querySelectorAll('.testimonial');
    if (testimonials.length > 1) {
        let currentTestimonial = 0;
        
        function showTestimonial(index) {
            testimonials.forEach((testimonial, i) => {
                testimonial.style.display = i === index ? 'block' : 'none';
            });
        }
        
        // Show first testimonial
        showTestimonial(0);
        
        // Auto rotate testimonials
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 5000);
    }
});
// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const authButtons = document.querySelector('.auth-buttons');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
        
        // Toggle menu icon
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.navbar')) {
        navLinks.classList.remove('active');
        authButtons.classList.remove('active');
        
        // Reset menu icon
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});
