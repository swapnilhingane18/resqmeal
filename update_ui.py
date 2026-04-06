import os
import re

filepath = r"c:\Users\swapnil\OneDrive\Desktop\Resqmeal\src\pages\donor\AddFoodPage.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Card Design
content = content.replace(
    'className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow scroll-mt-36"',
    'className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-10 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 scroll-mt-36"'
)

# 2. Section Headers
old_header_1 = '''<h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">🥗</span> Food Details
                        </h2>'''
new_header_1 = '''<div className="flex items-center gap-4 mb-8 border-b border-stone-200/60 pb-5">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">🥗</div>
                            <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Food Details</h2>
                        </div>'''
content = content.replace(old_header_1, new_header_1)

old_header_2 = '''<h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">⏳</span> Expiry & Location
                        </h2>'''
new_header_2 = '''<div className="flex items-center gap-4 mb-8 border-b border-stone-200/60 pb-5">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">⏳</div>
                            <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Expiry & Location</h2>
                        </div>'''
content = content.replace(old_header_2, new_header_2)

old_header_3 = '''<h2 className="text-base font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
                            <span className="text-xl">📞</span> Contact Identity
                        </h2>'''
new_header_3 = '''<div className="flex items-center gap-4 mb-8 border-b border-stone-200/60 pb-5">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">📞</div>
                            <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Contact Identity</h2>
                        </div>'''
content = content.replace(old_header_3, new_header_3)

# 3. Form Inputs/Textareas/Selects Base Classes
content = content.replace('peer block w-full rounded-xl border appearance-none px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all',
                          'peer block w-full h-14 rounded-2xl border appearance-none px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300')
content = content.replace('peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all',
                          'peer block w-full h-14 rounded-2xl border px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300')
content = content.replace('peer block w-full md:w-2/3 rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all',
                          'peer block w-full md:w-2/3 h-14 rounded-2xl border px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300')
content = content.replace('peer block w-full md:w-1/2 rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all',
                          'peer block w-full md:w-1/2 h-14 rounded-2xl border px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300')

# Textareas
content = content.replace('peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none',
                          'peer block w-full rounded-2xl border px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300 resize-none')
content = content.replace('peer block w-full rounded-xl border px-4 pb-2 pt-6 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border-stone-200 resize-none hover:border-stone-300',
                          'peer block w-full rounded-2xl border px-4 pb-2 pt-6 text-sm text-stone-800 bg-stone-50/50 hover:bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-[3px] focus:ring-emerald-500/20 transition-all duration-300 border-stone-200 resize-none hover:border-emerald-400')

# Update hover border where ternary is used
content = content.replace("hover:border-stone-300", "hover:border-emerald-400")

# 4. Labels
# Floating labels config 1
content = content.replace('absolute left-4 top-4 z-10 origin-[0] -translate-y-2 scale-75 transform text-sm duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2 peer-focus:scale-75 pointer-events-none font-medium',
                          'absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-[13px] tracking-wide duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 pointer-events-none font-semibold')
# Floating labels config 2 (For selects which have text-xs initially and then on focus)
content = content.replace('absolute left-4 top-2 text-xs font-medium transition-all pointer-events-none',
                          'absolute left-4 top-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 pointer-events-none')

# 5. Buttons in location section
content = content.replace('className="flex-1 py-3.5 text-sm font-bold border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-emerald-700 hover:border-emerald-200 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"',
                          'className="flex-1 py-4 text-sm font-bold border-stone-200 text-stone-700 bg-white rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20"')
content = content.replace('className="flex-1 py-3.5 text-sm font-bold border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-amber-200 hover:text-amber-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"',
                          'className="flex-1 py-4 text-sm font-bold border-stone-200 text-stone-700 bg-white rounded-xl hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-amber-500/20"')


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("UI Update completed!")
