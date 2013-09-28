Echolocation
======

A system to allow a set of computers to determine their location relative to one another

Assumes every device has speakers and a microphone with reasonable precision.

A [Meteor](http://docs.meteor.com/) App. Deployed at [echolocation.meteor.com](http://echolocation.meteor.com/)

Algorithm
----
**Initially establishing position amongst a set of N nodes**

Steps 1-3: Initialization
Steps 4-10: Clock Synchronization
Steps 11-13: Distance and Location determination

1. All devices connect to the server (or ad-hoc network). An arbitrary ordering is determined, where the first node is called A, the second B, etc. Nodes will be referred to by their letter as a name, but each also has a number "n", so for A, n=0; B, n=1; etc.
2. Each device determines the frequency it will signal on as given by `X + (-1)^n*Y*n`. A device signaling on it's frequency will be referred to as "chirping", to distinguish from signaling over another medium (like the network).
3. Each node sets up a local, high-precision timer that will fire at an agreed upon frequency Z. For simplicity, choose Z such that `1/Z` (the period) > (max dist between nodes * speed of sound + network latency). In practice, `Z = 1/(2 seconds)` works well.
4. When all nodes are ready, node A tells all other nodes to chirp at the next time their timer fires. Node A records the time that it heard each node's chirp, identified by frequency.
5. For each node i, A computes the difference between when it heard node i's chirp and when A's own timer fired. This difference is noted as `Delta(A, i)`. To build intuition, `Delta(A, i) = 1` second signifies that A heard i's chirp 1 seconds after A's own timer fired.
6. Node A then tells each node i to act at the next timer fire, but rather than chirping immediately, first to wait `(1/Z - Delta(A, i))` and then chirp. By doing this, A is attempting to get all nodes to chirp not at the same absolute time, at times such that A will hear all nodes at the same time. For instance if node B was one second left of A by sound and node C was two seconds right by sound, B would chirp one second after C in absolute time, so that A would hear both B and C at the same time. B and C would hear C two seconds after B chirped.
7. Node A then repeates step 5 and 6 until A hears all nodes at the same time, within the desired level of precision. The precision of this determines how exact the locations will be.
8. At A's next timer fire, A chirps, and each node records the distance between when they heard node A chirp and when their own timer fired. By our earlier notation, this is `Delta(i, A)`. This can optionally be repeated for higher precision.
9. `Delta(A, i)` and `Delta(i, A)` is now known for each i. We will introduce two other terms, `ClockOffset(i, j)`, which is the difference in absolute time between when node i's timer fires and when node j's timer fires; and `TimeDist(i, j)`, which is the amount of time it takes for sound to go from node i to node j. Clearly, `TimeDist(i, j) = TimeDist(j, i)` and `ClockOffset(i,j) = - ClockOffset(j, i)`. Also, `Delta(A, i) = ClockOffset(A, i) + TimeDist(A, i)`. Therefore, we can solve for `ClockOffset(A, i) = (Delta(A, i) - Delta(i, A))/2` and `TimeDist(A, i) = (Delta(A,i) + Delta(i,A))/2`.
10. All nodes now offset their timers by `ClockOffset(A, i)`, such that all nodes have timers that fire at the exact same absolute time.
11. At the next timer fire (we no longer need to specify who's timer, as they are all in sync), all nodes chirp.
12. Each node records when it hears each other node's frequency, and therefore determines `TimeDist(i,j)` for all i,j.
13. Distances between nodes are calculated by `Dist(i,j) = (Speed of sound) * TimeDist(i,j)`. Relative positions can calculated by one of a variety of methods, but the recommended way is based on simulating a system where each node i is a ball connected to each other ball j by a spring of length `Dist(i,j)` and determining the minimum energy state.


Note that steps 1-10 can be used independently for situations where nearby devices need to have highly synchronized clocks.


Overall, people first hear a number of different chirps at different fequencies and different times (Step 4), but the chirps soon start converging until they overlap, at least for some places in the room (Step 5-7). There is then a single chirp from one node (Step 8), after which there is a unified chirp of everyone at the same time (Step 11).

**Adding nodes**

To add a node to the network, the steps are very similar. First, the device is initialized via steps 1-3. We'll call this new node N. Delta(A,N) is calculated via steps 4-7 as before, and Delta(N,A) subsequently by step 8. Step 9 and 10 then assure that node N is synced to the timer of the network. Finally, node N chrips, and all nodes determine Dist(i, N), and therefore N's relative position in the network.

Architecture
-----
**Design of the system**

Client side:

- Module for chirping at a specific frequency
- Module for recording sound over a given interval and recording what chrips were heard at what offsets
- Timer-driven main event loop

Server side:

- Module for coordinating the onboarding of nodes, assignment and communication of who is on which frequency.
