import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Scanner;
import java.util.UUID;

class Earbud implements Comparable<Earbud> {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    private final String id;
    private final String brand;
    private final String color;
    private final String location;
    private final LocalDateTime dateReported;
    private boolean isFound;

    public Earbud(String brand, String color, String location, boolean isFound) {
        this.id = UUID.randomUUID().toString();
        this.brand = brand;
        this.color = color;
        this.location = location;
        this.dateReported = LocalDateTime.now();
        this.isFound = isFound;
    }
    
    public String getId() {
        return id;
    }
    
    public LocalDateTime getDateReported() {
        return dateReported;
    }
    
    @Override
    public int compareTo(Earbud other) {
        // For PriorityQueue: most recent first
        return other.dateReported.compareTo(this.dateReported);
    }

    // Getters
    public String getBrand() {
        return brand;
    }
    
    public String getColor() {
        return color;
    }
    
    public String getLocation() {
        return location;
    }
    
    public boolean isFound() {
        return isFound;
    }
    
    public void setFound(boolean found) {
        isFound = found;
    }
    
    @Override
    public String toString() {
        return "ID: " + id + 
               "\nBrand: " + brand + 
               "\nColor: " + color + 
               "\nLocation: " + location + 
               "\nDate Reported: " + dateReported.format(FORMATTER) + 
               "\nStatus: " + (isFound ? "Found" : "Lost") + "\n";
    }
}

public class EarbudTracker {
    private final String id;
    private static final Map<String, Earbud> earbudMap = new HashMap<>();
    private static final PriorityQueue<Earbud> recentReports = new PriorityQueue<>();
    
    public EarbudTracker() {
        this.id = UUID.randomUUID().toString();
    }
    
    public String getId() {
        return id;
    }
    
    public static void main(String[] args) {
        try (Scanner scanner = new Scanner(System.in)) {
            boolean running = true;
            
            while (running) {
                try {
                    System.out.println("\n=== Earbud Tracker ===");
                    System.out.println("1. Report Lost Earbuds");
                    System.out.println("2. Report Found Earbuds");
                    System.out.println("3. Search for Lost Earbuds");
                    System.out.println("4. Exit");
                    System.out.print("Choose an option (1-4): ");
                    
                    String input = scanner.nextLine().trim();
                    
                    if (input.isEmpty()) {
                        System.out.println("Please enter a number between 1 and 4.");
                        continue;
                    }
                    
                    try {
                        int choice = Integer.parseInt(input);
                        
                        switch (choice) {
                            case 1:
                                reportLostEarbuds(scanner);
                                break;
                            case 2:
                                reportFoundEarbuds(scanner);
                                break;
                            case 3:
                                searchLostEarbuds(scanner);
                                break;
                            case 4:
                                running = false;
                                System.out.println("Thank you for using Earbud Tracker!");
                                break;
                            default:
                                System.out.println("Invalid option. Please enter a number between 1 and 4.");
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("Please enter a valid number.");
                    }
                } catch (Exception e) {
                    System.out.println("An error occurred: " + e.getMessage());
                }
            }
        }
    }

    private static void reportLostEarbuds(Scanner scanner) {
        System.out.println("\n=== Report Lost Earbuds ===");
        System.out.print("Enter brand: ");
        String brand = scanner.nextLine();
        
        System.out.print("Enter color: ");
        String color = scanner.nextLine();
        
        System.out.print("Enter location where lost: ");
        String location = scanner.nextLine();
        
        Earbud earbud = new Earbud(brand, color, location, false);
        earbudMap.put(earbud.getId(), earbud);
        recentReports.offer(earbud);
        
        System.out.println("\nEarbuds reported as lost. Here are the details:");
        System.out.println(earbud);
    }

    private static void reportFoundEarbuds(Scanner scanner) {
        System.out.println("\n=== Report Found Earbuds ===");
        if (earbudMap.isEmpty()) {
            System.out.println("No lost earbuds in the system.");
            return;
        }
        
        System.out.println("Select which earbuds were found:");
        int count = 1;
        for (Earbud earbud : earbudMap.values()) {
            if (!earbud.isFound()) {
                System.out.println(count + ". " + earbud.getBrand() + " - " + earbud.getColor());
                count++;
            }
        }
        
        System.out.print("Enter the number (or 0 to cancel): ");
        int choice = scanner.nextInt();
        scanner.nextLine(); // consume newline
        
        if (choice > 0) {
            int index = 1;
            for (Earbud earbud : earbudMap.values()) {
                if (!earbud.isFound()) {
                    if (index == choice) {
                        earbud.setFound(true);
                        System.out.println("\nEarbuds marked as found!");
                        System.out.println(earbud);
                        break;
                    }
                    index++;
                }
            }
        } else if (choice != 0) {
            System.out.println("Invalid selection.");
        }
    }

    private static void searchLostEarbuds(Scanner scanner) {
        System.out.println("\n=== Search Lost Earbuds ===");
        System.out.println("1. Search by brand/color");
        System.out.println("2. View recent reports");
        System.out.print("Choose search option (1-2): ");
        
        String option = scanner.nextLine().trim();
        
        if ("1".equals(option)) {
            System.out.print("Enter brand to search (leave blank to skip): ");
            String brand = scanner.nextLine().toLowerCase();
            
            System.out.print("Enter color to search (leave blank to skip): ");
            String color = scanner.nextLine().toLowerCase();
            
            System.out.println("\nMatching lost earbuds:");
            boolean found = false;
            
            for (Earbud earbud : earbudMap.values()) {
                if (!earbud.isFound() && 
                    (brand.isEmpty() || earbud.getBrand().toLowerCase().contains(brand)) &&
                    (color.isEmpty() || earbud.getColor().toLowerCase().contains(color))) {
                    System.out.println(earbud);
                    found = true;
                }
            }
            
            if (!found) {
                System.out.println("No matching lost earbuds found.");
            }
        } else if ("2".equals(option)) {
            System.out.println("\nMost recent reports:");
            int count = 0;
            PriorityQueue<Earbud> tempQueue = new PriorityQueue<>(recentReports);
            
            while (!tempQueue.isEmpty() && count < 5) {
                Earbud earbud = tempQueue.poll();
                if (!earbud.isFound()) {
                    System.out.println(earbud);
                    count++;
                }
            }
            
            if (count == 0) {
                System.out.println("No recent lost earbud reports found.");
            }
        } else {
            System.out.println("Invalid option. Please try again.");
        }
    }
}
