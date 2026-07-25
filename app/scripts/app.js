import { invitation } from "../data/invitation.js";
import { installInteractions } from "./interactions.js";
import { renderInvitation } from "./render.js";

const state = renderInvitation(invitation);
installInteractions(invitation, state);
