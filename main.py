from tkinter import *

window = Tk()
window.title('Gubs')
window.configure(background='#5c4d42')

photo1 = PhotoImage(file='gub_card.png')
Label(window, image=photo1, background='#5c4d42').grid(row=0, column=0, sticky=W)

window.mainloop()


"""
players: cards in hand, cards in play
deck of cards: drawcard

gubs: move to discard pile. add to total points
spear:moves a gub or protection card to discard
mushroom: protect gub
toad ridaaaaaa: protect gub 
discard pile:

event cards: when drawn -> used
flashflood: discard all naked gubs
G U B cards: win logic, if tie, lowest ammount of cards in hand wins


"""