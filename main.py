from tkinter import *

window = Tk()
window.title('Gubs')
window.configure(background='#5c4d42')

photo1 = PhotoImage(file='gub_card.png')
Label(window, image=photo1, background='#5c4d42').grid(row=0, column=0, sticky=W)

window.mainloop()


