<script setup lang="ts"></script>

<template>
    <div class="max-w-7xl min-h-screen mx-auto px-6 flex flex-col">
		<header
			:class="[
				'sticky top-0 z-50 transition-all duration-300',
				scrolled ? 'bg-white md:bg-white/80 md:backdrop-blur-md md:shadow-[0_4px_24px_rgba(0,0,0,0.07)]' : 'bg-white',
				navHidden ? 'md:-translate-y-full' : 'translate-y-0'
			]"
		>
			<div class="py-4 flex items-center justify-between">
				<!-- Logo Section -->
				<!-- <router-link to="/" class="hover:opacity-80 transition-opacity"> -->
				<!-- 	<div class="flex flex-row items-center"> -->
				<!-- 		<div class="flex items-center"> -->
				<!-- 			<img src="/logo.png" alt="Logo" class="-ml-3 w-22 h-22 object-contain" /> -->
				<!-- 		</div> -->
				<!-- 		<div class="flex flex-col -ml-6"> -->
				<!-- 			<p class="text-4xl mb-1 font-bold text-gray-900 title-font justified-title">Aya Debes</p> -->
				<!-- 			<p class="text-xs text-gray-600 justified-title">Illustrator and 2D animator</p> -->
				<!-- 		</div> -->
				<!-- 	</div> -->
				<!-- </router-link> -->

				<!-- Navigation Links -->
				<nav class="hidden md:flex items-center gap-8 text-sm text-gray-700">
					<router-link to="/about" class="hover:text-gray-900 transition-colors">About</router-link>
					<router-link to="/work" class="hover:text-gray-900 transition-colors">Work</router-link>
					<router-link to="/illustrations"
						class="hover:text-gray-900 transition-colors">Illustrations</router-link>
					<router-link to="/animation" class="hover:text-gray-900 transition-colors">Animation</router-link>
					<router-link to="/shop" class="hover:text-gray-900 transition-colors">Shop</router-link>
					<router-link to="/contact" class="hover:text-gray-900 transition-colors pr-6">Contact</router-link>
				</nav>

				<!-- Mobile Menu Button -->
				<!-- <button @click="toggleMobileMenu" class="md:hidden text-gray-700"> -->
				<!-- 	<svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> -->
				<!-- 		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /> -->
				<!-- 	</svg> -->
				<!-- 	<svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> -->
				<!-- 		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /> -->
				<!-- 	</svg> -->
				<!-- </button> -->
			</div>

			<!-- Mobile Menu Dropdown -->
			<!-- <Transition name="mobile-menu"> -->
			<!-- 	<div v-if="mobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 bg-white py-4 shadow-lg"> -->
			<!-- 		<nav class="flex flex-col gap-4"> -->
			<!-- 			<router-link -->
			<!-- 				to="/about" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.05s" -->
			<!-- 			> -->
			<!-- 				About -->
			<!-- 			</router-link> -->
			<!-- 			<router-link -->
			<!-- 				to="/work" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.1s" -->
			<!-- 			> -->
			<!-- 				Work -->
			<!-- 			</router-link> -->
			<!-- 			<router-link -->
			<!-- 				to="/illustrations" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.15s" -->
			<!-- 			> -->
			<!-- 				Illustrations -->
			<!-- 			</router-link> -->
			<!-- 			<router-link -->
			<!-- 				to="/animation" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.2s" -->
			<!-- 			> -->
			<!-- 				Animation -->
			<!-- 			</router-link> -->
			<!-- 			<router-link -->
			<!-- 				to="/shop" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.25s" -->
			<!-- 			> -->
			<!-- 				Shop -->
			<!-- 			</router-link> -->
			<!-- 			<router-link -->
			<!-- 				to="/contact" -->
			<!-- 				@click="closeMobileMenu" -->
			<!-- 				class="text-lg text-gray-700 hover:text-gray-900 transition-colors py-2 mobile-menu-item" -->
			<!-- 				style="animation-delay: 0.3s" -->
			<!-- 			> -->
			<!-- 				Contact -->
			<!-- 			</router-link> -->
			<!-- 		</nav> -->
			<!-- 	</div> -->
			<!-- </Transition> -->
		</header>
    </div>
</template>

<style scoped></style>
