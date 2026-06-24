#Mini Project 1- Snake Water Gun
'''
Snake = 0
Water = 1
Gun = -1
'''
# This helps us to generate a random number between 1, 0, -1.
import random
print('''\n\t\tLET'S PLAY SNAKE WATER GUN :)
S/s - SNAKE
W/w - WATER
G/g - GUN\n''') # This is the user interface for the game.

# It will keep track of the number of wins, losses and draws for the user and computer. Initalze before the loop starts.
user_result = 0
computer_result = 0
draw_result = 0

while True: # This is the main loop of the game. It will keep running until the user decides to quit the game.
    computer = random.choice((1 , 0 , -1))
    your_input = input("\nENTER YOUR CHOICE:").lower() #lower() is used to convert the input to lowercase. 

    #Made a dictionary to convert the user input to the corresponding number. 
    choices = { "s" : 0, "w" : 1, "g" : -1}

    # if the user input is not in the choices dictionary, then it will print 'INVALID CHOICE'. Otherwise, else will execute the game logic.
    if(your_input not in choices):
        print("INVALID CHOICE, TRY AGAIN!")
        continue # This will skip the rest of the code in the loop. It will ask to enter their choice again. 

    # in you variable we will store the corresponding number of the user input, which we will get from the choices dictionary.
    else:
        you= choices[your_input]
        name_dict = {1 : "WATER", 0 : "SNAKE", -1 : "GUN"} # this converts number to their full name for better user experience.

        print(f"YOU ENTERED {name_dict[you]}.\nCOMPUTER ENTERED {name_dict[computer]}.")
        
        if (computer == you):
            print("IT'S A DRAW!!")
            draw_result += 1

        elif (computer == 0 and you == -1):
            print("YOU WIN :)")
            user_result += 1

        elif (computer == 0 and you == 1):
            print("YOU LOSE :(")
            computer_result += 1

        elif (computer == 1 and you == -1):
            print("YOU LOSE :(")
            computer_result += 1

        elif (computer == 1 and you == 0):
            print("YOU WIN :)")
            user_result += 1

        elif (computer == -1 and you == 1):
            print("YOU WIN :)")
            user_result += 1

        elif (computer == -1 and you == 0):
            print("YOU LOSE :(")
            computer_result += 1
    
    # This will print the score of the user, computer and draw after each round.
    print(f"\nYOUR SCORE: {user_result}\nCOMPUTER SCORE: {computer_result}\nDRAW SCORE: {draw_result}") 

    while True:
        play_again = input("\nDO YOU WANT TO PLAY AGAIN? (Y/N): ").lower() # Asking the user if they want to play again. 
        if (play_again == "y" or play_again == "n"):
            break
        else:
            print("INVALID CHOICE, TRY AGAIN!")
      
    if play_again == "n": # If the user input is not 'y', then it will break the loop and end the game. Otherwise, it will continue the loop. 
        if (user_result > computer_result):
            print("\n\t🏆 YOU WON THE SERIES!")

        elif (computer_result > user_result):
            print("\n\t🏆 COMPUTER WON THE SERIES!")

        else:
            print("\n\t🏆 THE SERIES IS A DRAW!")
        break    


print("\n\tTHANKS FOR PLAYING!")
print("\tSEE YOU SOON :)")

# This is the end of the code. You can run this code and play the game. Enjoy :)