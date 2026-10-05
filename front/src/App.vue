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

const handleScroll = () => {
	const currentScrollY = window.scrollY
	scrolled.value = currentScrollY > 20
	if (currentScrollY > lastScrollY && currentScrollY > 80) {
		navHidden.value = true
	} else {
		navHidden.value = false
	}
	lastScrollY = currentScrollY
}

onMounted(() => {
	window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
})

</script>

<template>
	<div class="max-w min-h-screen bg-panel mx-auto flex flex-col">
		<header
			:class="[
				'sticky mx-auto top-0 z-50 transition-all duration-300',
				scrolled ? 'bg-panel md:backdrop-blur-md md:shadow-[0_4px_24px_rgba(0,0,0,0.07)]' : 'bg-panel',
				navHidden ? 'md:-translate-y-full' : 'translate-y-0'
			]"
		>
			<div class="py-4 flex items-center justify-between">
				<!-- Navigation Links -->
				<nav class="hidden md:flex items-center gap-8 text-sm text-muted">
                    <router-link to="/" class="hover:text-fg transition-colors">Home</router-link>
					<router-link to="/playground" class="hover:text-fg transition-colors">Playground</router-link>
					<router-link to="/blog" class="hover:text-fg transition-colors">Blog</router-link>
					<router-link to="/contact" class="hover:text-fg transition-colors pr-6">Contact</router-link>
				</nav>

				<!-- Mobile Menu Button -->
				<button @click="toggleMobileMenu" class="md:hidden text-fg">
					<svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
					<svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Mobile Menu Dropdown -->
			<Transition name="mobile-menu">
				<div v-if="mobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 bg-panel py-4 shadow-lg">
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
		<div class="flex-1">
			<router-view />
		</div>
            <!-- </div> -->
    <!-- <SineTone/> -->
    </div>
</template>

<style>
* {
	font-family: "Montserrat", sans-serif;
	font-optical-sizing: auto;
	font-style: normal;
}

.title-font {
	font-family: "Cactus Classical Serif", serif;
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
</style
