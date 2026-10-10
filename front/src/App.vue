<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mobileMenuOpen = ref(false)
const navHidden = ref(false)
const scrolled = ref(false)
let lastScrollY = 0

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// const handleScroll = () => {
//   const currentScrollY = window.scrollY
//   scrolled.value = currentScrollY > 20
//   if (currentScrollY > lastScrollY && currentScrollY > 80) {
//     navHidden.value = true
//   } else {
//     navHidden.value = false
//   }
//   lastScrollY = currentScrollY
// }

// onMounted(() => {
//   window.addEventListener('scroll', handleScroll, { passive: true })
// })
//
// onUnmounted(() => {
//   window.removeEventListener('scroll', handleScroll)
// })
</script>

<template>
  <div class="max-w min-h-screen bg-panel flex flex-col">
    <header
      :class="[
        'sticky max-w top-0 px-12 z-50 transition-all duration-300',
        scrolled
          ? 'bg-panel md:backdrop-blur-md md:shadow-[0_4px_24px_rgba(0,0,0,0.07)]'
          : 'bg-panel',
        navHidden ? 'md:-translate-y-full' : 'translate-y-0',
      ]"
    >
      <div class="py-4 flex items-center justify-between">
        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm">
          <router-link to="/" class="hover:text-fg transition-colors"
            ><img src="/svg/icon.svg" width="50" height="50"
          /></router-link>
          <router-link
            to="/playground"
            class="text-teal hover:text-teal-300 opacity-75 hover:opacity-100 transition-colors"
            >Playground</router-link
          >
          <router-link
            to="/blog"
            class="text-lavender hover:text-lavender-300 hover:text-fg opacity-75 hover:opacity-100 transition-colors"
            >Blog</router-link
          >
          <router-link
            to="/contact"
            class="text-peach hover:text-peach-300 opacity-75 hover:opacity-100 transition-colors pr-6"
            >Contact</router-link
          >
        </nav>

        <!-- Mobile Menu Button -->
        <button @click="toggleMobileMenu" class="md:hidden text-fg">
          <svg
            v-if="!mobileMenuOpen"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <Transition name="mobile-menu">
        <div
          v-if="mobileMenuOpen"
          class="md:hidden absolute top-full left-0 right-0 bg-panel py-4 shadow-lg"
        >
          <nav class="flex flex-col gap-4">
            <router-link
              to="/playground"
              @click="closeMobileMenu"
              class="text-lg text-fg hover:text-fg transition-colors py-2 mobile-menu-item"
              style="animation-delay: 0.1s"
            >
              Playground
            </router-link>
            <router-link
              to="/blog"
              @click="closeMobileMenu"
              class="text-lg text-fg hover:text-fg transition-colors py-2 mobile-menu-item"
              style="animation-delay: 0.15s"
            >
              Blog
            </router-link>
            <router-link
              to="/animation"
              @click="closeMobileMenu"
              class="text-lg text-fg hover:text-fg transition-colors py-2 mobile-menu-item"
              style="animation-delay: 0.2s"
            >
              Contact
            </router-link>
          </nav>
        </div>
      </Transition>
    </header>

    <!-- Page Content -->
    <div class="flex-1 mx-12">
      <router-view />
    </div>

    <!-- Footer -->
    <footer class="my-32 mx-12">
      <div>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- Copyright -->
          <p class="text-xs text-surface1">
            © {{ new Date().getFullYear() }} Zaher Hamadeh. All rights reserved.
          </p>

          <!-- Social Media Links -->
          <div class="flex items-center gap-4">
            <a
              href="https://instagram.com/zaherhamadeh"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sapphire-700 hover:text-sapphire transition-colors"
              aria-label="Instagram"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  font-family: 'Montserrat', sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
}

.title-font {
  font-family: 'Cactus Classical Serif', serif;
  font-style: normal;
}

.justified-title {
  text-align: justify;
  text-align-last: justify;
  text-justify: inter-character;
  width: 100%;
}

/* Mobile menu animations */
.mobile-menu-enter-active {
  animation: slide-down 0.3s ease-out;
}

.mobile-menu-leave-active {
  animation: slide-up 0.2s ease-in;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.mobile-menu-item {
  animation: fade-in-slide 0.3s ease-out both;
}

@keyframes fade-in-slide {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
